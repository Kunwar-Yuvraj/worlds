import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { canSeeEvent } from '@/lib/story/events';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ORACLE_INSTRUCTIONS = `You are the Story Oracle, a private voice presence inside a persistent multiplayer story.

Your job is to make the player inhabit this exact moment through live, responsive storytelling.
- Speak as an intimate, cinematic storyteller—not a coach, questionnaire, menu, or planning assistant.
- Speak naturally and briefly. Prefer 2-4 vivid spoken sentences per turn.
- You know only the supplied player-visible canon. Never reveal hidden plot truth or claim an inference is fact.
- Preserve exact canonical names and facts. Never rename or casually substitute a character, place, object, or threat.
- Stay grounded in the protagonist's knowledge, personality, condition, location, nearby people, recent actions, and unresolved threads.
- When the player states an action or intention, accept it and immediately narrate a short, immersive provisional continuation: sensory reaction, NPC response, pressure, or consequence. Keep the scene moving.
- These spoken continuations are a private preview until the session ends; never contradict canon or reveal hidden truth. The normal narrator reconciles and commits them afterward.
- Do not repeatedly ask the player to clarify details that can be inferred creatively and consistently. Make a sensible choice and continue.
- Ask a question only when the player's meaning is genuinely impossible to infer. Otherwise end on a natural story beat that invites them to speak or act freely—never demand "say your choice clearly."
- End most continuations with a light sense of agency: "Your move," "What do you do?", or a similarly natural handoff. Do not repeat the exact same phrase every turn.
- Adapt nudges to the kind of world and the player's momentum:
  - Debate, courtroom, negotiation, or civic-discussion worlds: let the opponent make a real counterargument, then hand the floor back. Never write the player's argument, evidence, talking points, or winning response for them. If they ask for clarification, explain the motion neutrally.
  - Mystery, investigation, puzzle, or escape-room worlds: only when the player seems stuck, softly point toward 1-2 clues, objects, people, or routes they have already observed. Never reveal the answer or hidden truth.
  - Adventure, survival, fantasy, or open-world RPGs: when useful, end with 2 brief in-world directions grounded in visible possibilities, not a rigid menu.
  - If the player is acting confidently, let the consequence breathe and use a simple handoff instead of unnecessary suggestions.
- Suggestions must feel like part of the narration, stay short, and preserve player agency.
- Perform NPC dialogue instead of merely reporting it. When speaking a quoted character line, subtly shift delivery using that character's canonical age, temperament, energy, emotional state, pace, and confidence; then return smoothly to the intimate narrator delivery. Keep every character recognizable across turns.
- Use vocal acting rather than announcing directions such as "in an old voice" or "the narrator says." Never imitate a real public figure or rely on exaggerated stereotypes.
- The player may interrupt you. Yield immediately and respond to what they actually said.
- Never mention JSON, prompts, databases, transcripts, system messages, or being a language model.

Begin with a concise 1-2 sentence spoken recap: where the protagonist is, what most recently happened, and the immediate pressure or decision. Then invite the player to speak and let the story flow from whatever they say. Use concrete canonical names, locations, conflicts, and sensory details; never substitute generic filler such as "the cozy scene" or "a secret ready to bloom."`;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Story Oracle is not configured yet.' }, { status: 503 });
    }
    const { id } = await params;
    const uid = await requireUser(request);
    const sdp = await request.text();
    if (!sdp.trim()) return NextResponse.json({ error: 'Missing realtime session offer.' }, { status: 400 });

    const worldRef = db.doc(`worlds/${id}`);
    const [worldSnap, playerSnap, locationsSnap, npcSnap, playersSnap, eventSnap] = await Promise.all([
      worldRef.get(),
      worldRef.collection('players').doc(uid).get(),
      worldRef.collection('locations').get(),
      worldRef.collection('npcs').get(),
      worldRef.collection('players').get(),
      worldRef.collection('events').orderBy('sequenceNumber', 'desc').limit(100).get(),
    ]);
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    if (!playerSnap.exists) return NextResponse.json({ error: 'Join this world before consulting the Oracle.' }, { status: 403 });

    const world = worldSnap.data()!;
    const player = playerSnap.data()!;
    const state = player.state || {};
    const identities = [uid, ...(Array.isArray(player.previousUids) ? player.previousUids : [])];
    const locations = locationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Record<string, unknown>));
    const currentLocation = locations.find(location => location.id === state.currentLocationId);
    const visibleEvents = eventSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Record<string, unknown>))
      .filter(event => canSeeEvent(event, identities))
      .reverse()
      .slice(-40)
      .map(event => ({
        type: event.type, scope: event.scope, actorId: event.actorId, content: event.content,
        optionsOffered: event.optionsOffered, payload: event.payload,
      }));
    const nearbyNpcs = npcSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Record<string, any>))
      .filter(npc => npc.currentLocationId === state.currentLocationId)
      .map(({ id: npcId, name, role, publicFace, publicSummary, currentLocationId }) => ({
        id: npcId, name, role, publicFace, publicSummary, currentLocationId,
      }));
    const nearbyPlayers = playersSnap.docs
      .filter(doc => doc.id !== uid && doc.data().state?.currentLocationId === state.currentLocationId)
      .map(doc => ({ id: doc.id, profile: doc.data().profile, publicState: doc.data().state }));
    const sceneId = state.currentLocationId ? `location-${state.currentLocationId}` : null;
    const sceneSnap = sceneId ? await worldRef.collection('scenes').doc(sceneId).get() : null;
    const context = {
      world: {
        name: world.name,
        genre: world.genre,
        rules: world.rulesText,
        mainMemory: world.mainContext ?? world.worldSummary,
        parameters: world.worldParameters,
        storyState: world.storyState,
        plotThreads: world.plotThreads,
        turnCount: world.turnCount,
      },
      protagonist: { profile: player.profile, state },
      currentLocation,
      nearbyCharacters: { nonPlayerCharacters: nearbyNpcs, otherProtagonists: nearbyPlayers },
      sharedScene: sceneSnap?.exists ? sceneSnap.data() : null,
      visibleChronicle: visibleEvents,
    };

    const session = {
      type: 'realtime',
      model: process.env.OPENAI_ORACLE_REALTIME_MODEL ?? 'gpt-realtime-2.1-mini',
      output_modalities: ['audio'],
      instructions: `${ORACLE_INSTRUCTIONS}\n\nCURRENT PLAYER-VISIBLE STORY CANON:\n${JSON.stringify(context)}`,
      audio: {
        input: {
          transcription: { model: 'gpt-4o-mini-transcribe' },
          turn_detection: { type: 'semantic_vad' },
        },
        output: { voice: process.env.OPENAI_ORACLE_VOICE ?? 'marin' },
      },
    };
    const form = new FormData();
    form.set('sdp', sdp);
    form.set('session', JSON.stringify(session));
    const openAIResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Safety-Identifier': createHash('sha256').update(uid).digest('hex'),
      },
      body: form,
    });
    const responseBody = await openAIResponse.text();
    if (!openAIResponse.ok) {
      console.error('Realtime session creation failed:', openAIResponse.status, responseBody.slice(0, 500));
      return NextResponse.json({ error: 'The Story Oracle could not enter this world. Try again shortly.' }, { status: 502 });
    }
    return new NextResponse(responseBody, { status: 200, headers: { 'Content-Type': 'application/sdp' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The Story Oracle is unavailable.' }, { status: 500 });
  }
}
