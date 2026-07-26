import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth';
import { callLLM } from '@/lib/llm/adapter';
import { TURN_RESOLUTION_SYSTEM } from '@/lib/story/prompts';
import { turnResolution } from '@/lib/story/validate';
import { appendStoryEvent, canSeeEvent } from '@/lib/story/events';
import type { Npc, PlotThread, Scene, StoryState } from '@/lib/story/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

type ConsultationMessage = { role: 'user' | 'assistant'; content: string };

function cleanConsultation(value: unknown): ConsultationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map(item => ({
      role: item.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: typeof item.content === 'string' ? item.content.trim().slice(0, 4000) : '',
    }))
    .filter(item => item.content)
    .slice(-120);
}

export async function GET() {
  return NextResponse.json({ ready: true });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const uid = await requireUser(request); const { action, consultation: rawConsultation } = await request.json();
    if (!action?.trim()) return NextResponse.json({ error: 'An action is required.' }, { status: 400 });
    const consultation = cleanConsultation(rawConsultation);
    const worldRef = db.doc(`worlds/${id}`); const playerRef = worldRef.collection('players').doc(uid);
    const [worldSnap, plotSnap, playerSnap, locationsSnap, npcSnap, playersSnap, eventSnap] = await Promise.all([worldRef.get(), worldRef.collection('privateState').doc('plot').get(), playerRef.get(), worldRef.collection('locations').get(), worldRef.collection('npcs').get(), worldRef.collection('players').get(), worldRef.collection('events').orderBy('sequenceNumber', 'desc').limit(100).get()]);
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 }); if (!playerSnap.exists) return NextResponse.json({ error: 'Join this world before acting.' }, { status: 403 });
    const world = worldSnap.data()!; const player = playerSnap.data()!; const locations = locationsSnap.docs.map(doc => doc.data()); const locationIds = locations.map(location => location.id); const state = player.state;
    const allNpcs = npcSnap.docs.map(doc => doc.data() as Npc);
    const coLocated = playersSnap.docs.filter(doc => doc.id !== uid && doc.data().state?.currentLocationId === state.currentLocationId).map(doc => ({ id: doc.id, profile: doc.data().profile }));
    const participantIds = [uid, ...coLocated.map(item => item.id)]; const sceneId = coLocated.length ? `location-${state.currentLocationId}` : null;
    const sceneRef = sceneId ? worldRef.collection('scenes').doc(sceneId) : null; const currentScene = sceneRef ? await sceneRef.get() : null;
    const scene = currentScene?.exists ? currentScene.data() as Scene : null;
    const relevantNpcs = allNpcs.filter(npc => npc.currentLocationId === state.currentLocationId || scene?.visibleNpcIds?.includes(npc.id)).slice(0, 8);
    const identities = [uid, ...(Array.isArray(player.previousUids) ? player.previousUids : [])];
    const visibleEvents = eventSnap.docs.map(doc => doc.data() as Record<string, unknown>).filter(event => canSeeEvent(event, identities)).reverse().slice(-40);
    const sharedEvents = visibleEvents.filter(event => event.scope === 'world' || event.scope === 'scene').slice(-12);
    const privateEvents = visibleEvents.filter(event => {
      const audience = Array.isArray(event.audienceIds) ? event.audienceIds : [];
      return event.scope === 'private' && identities.some(identity => audience.includes(identity));
    }).slice(-8);
    let raw: string;
    try { raw = await callLLM({ systemPrompt: TURN_RESOLUTION_SYSTEM, userPrompt: `COMPLETE PUBLIC WORLD CANON:\n${JSON.stringify({ name: world.name, genre: world.genre, rulesText: world.rulesText ?? world.worldParameters?.rulesText, worldSummary: world.worldSummary, mainContext: world.mainContext ?? world.worldSummary, parameters: world.worldParameters, storyState: world.storyState, plotThreads: world.plotThreads, turnCount: world.turnCount, locations, npcs: allNpcs })}\n\nSERVER-ONLY PLOT TRUTH:\n${JSON.stringify(plotSnap.data() || {})}\n\nACTING PROTAGONIST — COMPLETE PERSONAL STORYLINE:\n${JSON.stringify({ id: uid, profile: player.profile, state })}\n\nCURRENT LOCATION:\n${JSON.stringify(locations.find(location => location.id === state.currentLocationId))}\n\nPUBLIC NPCS AT OR RELEVANT TO THIS LOCATION:\n${JSON.stringify(relevantNpcs)}\n\nOTHER PROTAGONISTS IN THE SAME SCENE (public profile only):\n${JSON.stringify(coLocated)}\n\nSHARED SCENE:\n${JSON.stringify(scene)}\n\nRECENT SHARED WORLD/SCENE EVENTS VISIBLE TO THIS PLAYER:\n${JSON.stringify(sharedEvents)}\n\nRECENT PRIVATE STORY EVENTS FOR THIS PROTAGONIST:\n${JSON.stringify(privateEvents)}${consultation.length ? `\n\nPRIVATE PRE-TURN ORACLE CONSULTATION:\n${JSON.stringify(consultation)}\nThis transcript is private deliberation and provisional storytelling, not a sequence of already committed actions. Use it to understand the protagonist's reasoning, emotional intent, and the final action they chose. Reconcile it against canon, then resolve exactly one final action. Persist personal consequences in playerState and only genuinely public consequences in mainContext/storyState.` : ''}\n\nFINAL ACTION TO RESOLVE:\n${action.trim()}`, json: true }); } catch { return NextResponse.json({ error: 'Narrator unavailable or rate-limited. Your action was not saved; wait a moment and retry.' }, { status: 503 }); }
    let parsed: unknown; try { parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()); } catch { return NextResponse.json({ error: 'Narrator returned invalid story data. Your action was not saved; please retry.' }, { status: 502 }); }
    const previousMainContext = String(world.mainContext ?? world.worldSummary ?? world.storyState?.publicSummary ?? '');
    const resolution = turnResolution(parsed, state, world.storyState as StoryState, previousMainContext, locationIds); if (!resolution) return NextResponse.json({ error: 'Narrator returned incomplete state. Your action was not saved; please retry.' }, { status: 502 });
    const updatedThreads = (world.plotThreads as PlotThread[]).map(thread => resolution.plotThreadUpdates.find(update => update.id === thread.id) || thread);
    const nextStoryState = { ...resolution.storyState, activeThreadIds: updatedThreads.filter(thread => thread.status === 'active').map(thread => thread.id) };
    await appendStoryEvent(id, { type: 'action', content: `${player.profile.name}: ${action.trim()}`, scope: 'private', actorId: uid, audienceIds: [uid], payload: { locationId: state.currentLocationId } });
    await appendStoryEvent(id, { type: 'narration', content: resolution.narration, scope: 'private', actorId: uid, audienceIds: [uid], optionsOffered: resolution.options, payload: { cliffhanger: resolution.playerState.cliffhanger } });
    if (sceneId && resolution.sceneEvent) await appendStoryEvent(id, { type: 'scene', content: resolution.sceneEvent, scope: 'scene', actorId: uid, audienceIds: participantIds, sceneId, payload: { locationId: state.currentLocationId } });
    if (resolution.worldEvent) await appendStoryEvent(id, { type: 'world', content: resolution.worldEvent, scope: 'world', actorId: uid, payload: { currentTime: nextStoryState.currentTime } });
    const batch = db.batch(); batch.update(playerRef, { state: resolution.playerState, updatedAt: FieldValue.serverTimestamp() }); batch.update(worldRef, { mainContext: resolution.mainContext, storyState: nextStoryState, plotThreads: updatedThreads, turnCount: (world.turnCount || 0) + 1, updatedAt: FieldValue.serverTimestamp() });
    const knownNpcIds = new Set(npcSnap.docs.map(doc => doc.id)); resolution.npcUpdates.filter(npc => knownNpcIds.has(npc.id)).forEach(npc => batch.set(worldRef.collection('npcs').doc(npc.id), npc, { merge: true }));
    if (sceneId && (resolution.sceneEvent || scene)) batch.set(sceneRef!, { id: sceneId, locationId: state.currentLocationId, participantIds, visibleNpcIds: relevantNpcs.map(npc => npc.id), sharedSummary: resolution.sceneSummary || scene?.sharedSummary || '', status: 'active', updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    await batch.commit();
    return NextResponse.json({ narration: resolution.narration, options: resolution.options, sceneEvent: resolution.sceneEvent, worldEvent: resolution.worldEvent, state: resolution.playerState });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to resolve action.' }, { status: 500 }); }
}
