import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { canSeeEvent } from '@/lib/story/events';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const uid = await requireUser(request); const worldRef = db.doc(`worlds/${id}`);
    const [worldSnap, playerSnap, locationsSnap, npcSnap, eventSnap] = await Promise.all([worldRef.get(), worldRef.collection('players').doc(uid).get(), worldRef.collection('locations').get(), worldRef.collection('npcs').get(), worldRef.collection('events').orderBy('sequenceNumber', 'desc').limit(100).get()]);
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 });
    const { passwordHash, nextSequence, createdBy, ...world } = worldSnap.data()!;
    const player = playerSnap.exists ? playerSnap.data() : null;
    const visibleEvents = eventSnap.docs.reverse().map(doc => ({ id: doc.id, ...doc.data() } as Record<string, unknown> & { id: string })).filter(event => canSeeEvent(event, uid)).slice(-24);
    const currentSceneId = player?.state?.currentLocationId ? `location-${player.state.currentLocationId}` : null; const sceneSnap = currentSceneId ? await worldRef.collection('scenes').doc(currentSceneId).get() : null;
    return NextResponse.json({ world: { id, ...world }, player, locations: locationsSnap.docs.map(doc => doc.data()), npcs: npcSnap.docs.map(doc => doc.data()), scene: sceneSnap?.exists ? sceneSnap.data() : null, events: visibleEvents });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load world.' }, { status: 401 }); }
}
