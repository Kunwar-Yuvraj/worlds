import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { callLLM } from '@/lib/llm/adapter';
import { WORLD_BLUEPRINT_SYSTEM } from '@/lib/story/prompts';
import { worldBlueprint } from '@/lib/story/validate';
import { STORY_VERSION } from '@/lib/story/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUser(request);
    const { name, genre, premise, tone, powerSystem, hardRules = [], factions = [], startingPressure, playerProtocol, storyProtocol, rulesText, visibility, password } = await request.json();
    if (!name?.trim() || !genre?.trim() || !premise?.trim() || !rulesText?.trim() || !['public', 'private'].includes(visibility)) return NextResponse.json({ error: 'Name, genre, premise, rules, and visibility are required.' }, { status: 400 });
    if (visibility === 'private' && !password) return NextResponse.json({ error: 'A private world needs a password.' }, { status: 400 });
    let raw: string;
    try { raw = await callLLM({ systemPrompt: WORLD_BLUEPRINT_SYSTEM, userPrompt: `WORLD PARAMETERS:\n${JSON.stringify({ name, genre, premise, tone, powerSystem, hardRules, factions, startingPressure, playerProtocol, storyProtocol, rulesText })}`, json: true }); } catch { return NextResponse.json({ error: 'The world architect is temporarily unavailable. Please retry shortly; no world was created.' }, { status: 503 }); }
    const blueprint = worldBlueprint(JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()));
    if (!blueprint) return NextResponse.json({ error: 'The world architect returned an incomplete blueprint. Please retry.' }, { status: 502 });
    const worldRef = db.collection('worlds').doc(); const batch = db.batch();
    batch.set(worldRef, { schemaVersion: STORY_VERSION, name: name.trim(), genre: genre.trim(), visibility, passwordHash: visibility === 'private' ? await bcrypt.hash(password, 10) : null, worldParameters: { premise, tone, powerSystem, hardRules, factions, startingPressure, playerProtocol, storyProtocol, rulesText }, worldSummary: blueprint.worldSummary, mainContext: blueprint.worldSummary, storyState: blueprint.storyState, plotThreads: blueprint.plotThreads, createdBy: uid, createdAt: FieldValue.serverTimestamp(), turnCount: 0, nextSequence: 1 });
    batch.set(worldRef.collection('privateState').doc('plot'), blueprint.hiddenPlot);
    blueprint.locations.forEach(location => batch.set(worldRef.collection('locations').doc(location.id), location));
    blueprint.npcs.forEach(npc => batch.set(worldRef.collection('npcs').doc(npc.id), npc));
    await batch.commit();
    return NextResponse.json({ worldId: worldRef.id }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create world.' }, { status: 401 }); }
}
