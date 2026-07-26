import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { PRESETS } from '@/lib/presets';
import { STORY_VERSION, normalizeId } from '@/lib/story/schema';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUser(request);
    const { presetName, playMode } = await request.json();
    const preset = PRESETS.find(item => item.name === presetName);

    if (!preset) return NextResponse.json({ error: 'Preset not found.' }, { status: 404 });
    if (!['solo', 'group'].includes(playMode)) {
      return NextResponse.json({ error: 'Choose whether this run is solo or multiplayer.' }, { status: 400 });
    }

    const worldRef = db.collection('worlds').doc();
    const threadId = `${normalizeId(preset.name)}-opening`;
    const isGroup = playMode === 'group';
    const playerProtocol = isGroup
      ? 'This is a cooperative run. Every player owns one protagonist and private perspective. Players share facts only through visible actions, dialogue, or deliberate clue-sharing; shared scenes update everyone present.'
      : 'This is a solo run. The protagonist retains full agency while NPC companions fill useful missing roles. Companions may advise, disagree, or help, but never make the protagonist’s defining choice.';
    const batch = db.batch();

    batch.set(worldRef, {
      schemaVersion: STORY_VERSION,
      name: preset.name,
      genre: preset.genre,
      playMode,
      visibility: isGroup ? 'public' : 'unlisted',
      passwordHash: null,
      worldParameters: {
        premise: preset.seedContext,
        tone: preset.tone,
        powerSystem: preset.powerSystem,
        hardRules: preset.hardRules,
        factions: preset.factions,
        startingPressure: preset.startingPressure,
        playerProtocol,
        storyProtocol: preset.storyProtocol,
        rulesText: preset.rulesText,
      },
      worldSummary: preset.seedContext,
      storyState: {
        currentTime: preset.currentTime,
        publicSummary: preset.seedContext,
        currentSituation: preset.currentSituation,
        activeThreadIds: [threadId],
      },
      plotThreads: [{
        id: threadId,
        title: preset.openingThread.title,
        status: 'active',
        publicSummary: preset.openingThread.publicSummary,
        stakes: preset.openingThread.stakes,
      }],
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      turnCount: 0,
      nextSequence: 1,
    });

    batch.set(worldRef.collection('privateState').doc('plot'), {
      premise: preset.seedContext,
      ...preset.hiddenPlot,
    });

    preset.locations.forEach(location => {
      batch.set(worldRef.collection('locations').doc(location.id), location);
    });
    preset.npcs.forEach(npc => {
      batch.set(worldRef.collection('npcs').doc(npc.id), npc);
    });

    await batch.commit();
    return NextResponse.json({ worldId: worldRef.id, playMode }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create preset.' }, { status: 401 });
  }
}
