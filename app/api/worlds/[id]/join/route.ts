import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { callLLM } from '@/lib/llm/adapter';
import { CHARACTER_BLUEPRINT_SYSTEM } from '@/lib/story/prompts';
import { characterBlueprint } from '@/lib/story/validate';
import { appendStoryEvent } from '@/lib/story/events';
import type { PlayerState } from '@/lib/story/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const uid = await requireUser(request);
    const { password, displayName, background = '', storyIntent = '', appearance = '', personality = '' } = await request.json();
    const worldRef = db.doc(`worlds/${id}`); const [worldSnap, plotSnap, locationsSnap] = await Promise.all([worldRef.get(), worldRef.collection('privateState').doc('plot').get(), worldRef.collection('locations').get()]);
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    const world = worldSnap.data()!;
    if (world.visibility === 'private' && !(await bcrypt.compare(password ?? '', world.passwordHash))) return NextResponse.json({ error: 'Incorrect password.' }, { status: 403 });
    const playerRef = worldRef.collection('players').doc(uid); if ((await playerRef.get()).exists) return NextResponse.json({ alreadyJoined: true });
    const locations = locationsSnap.docs.map(doc => doc.data()); const locationIds = locations.map(location => location.id); const entry = locationIds[0];
    const fallback: PlayerState = { currentLocationId: entry, currentObjective: 'Find your place in this world', currentActivity: 'Arriving', privateSummary: 'Your personal story is about to begin.', activeQuestIds: [], knownFacts: [], relationships: [], inventory: [], condition: 'Unharmed', cliffhanger: 'A new world waits to test your resolve.', turnCount: 0 };
    let raw: string;
    try { raw = await callLLM({ systemPrompt: CHARACTER_BLUEPRINT_SYSTEM, userPrompt: `PUBLIC WORLD SUMMARY:\n${world.worldSummary}\n\nPUBLIC STORY STATE:\n${JSON.stringify(world.storyState)}\n\nWORLD PARAMETERS:\n${JSON.stringify(world.worldParameters)}\n\nAVAILABLE LOCATIONS:\n${JSON.stringify(locations)}\n\nPLAYER NAME PREFERENCE: ${displayName || 'None'}\nPLAYER BACKGROUND: ${background || 'Create an original fitting background.'}\nPLAYER APPEARANCE: ${appearance || 'Choose a fitting appearance.'}\nPLAYER PERSONALITY: ${personality || 'Choose a fitting personality.'}\nPLAYER STORY INTENT: ${storyIntent || 'Create a tense personal opening.'}\n\nDo not reveal this hidden plot, but keep their arc compatible with it:\n${plotSnap.data()?.integritySummary || ''}`, json: true }); } catch { return NextResponse.json({ error: 'The character writer is temporarily unavailable. Please retry shortly; no character was created.' }, { status: 503 }); }
    let parsed: unknown; try { parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()); } catch { return NextResponse.json({ error: 'The character writer returned an invalid response. Please retry.' }, { status: 502 }); }
    const character = characterBlueprint(parsed, fallback, locationIds); if (!character) return NextResponse.json({ error: 'The character writer returned an incomplete profile. Please retry.' }, { status: 502 });
    character.name = displayName?.trim() || character.name; if (background?.trim()) character.background = background.trim(); if (appearance?.trim()) character.appearance = appearance.trim(); if (personality?.trim()) character.personality = personality.trim();
    await playerRef.set({ displayName: character.name, profile: { name: character.name, role: character.role, appearance: character.appearance, personality: character.personality, background: character.background, strengths: character.strengths, constraints: character.constraints, goals: character.goals, privateArc: character.privateArc }, state: character.state, joinedAt: FieldValue.serverTimestamp() });
    await appendStoryEvent(id, { type: 'system', content: `${character.name} has entered ${locations.find(location => location.id === character.state.currentLocationId)?.name || 'the world'}.`, scope: 'world' });
    return NextResponse.json({ profile: character }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to join world.' }, { status: 401 }); }
}
