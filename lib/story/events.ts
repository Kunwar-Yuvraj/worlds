import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/admin';

export type StoryEventInput = { type: 'action' | 'narration' | 'scene' | 'world' | 'system'; content: string; scope: 'private' | 'scene' | 'world'; actorId?: string | null; audienceIds?: string[]; sceneId?: string | null; optionsOffered?: string[]; payload?: Record<string, unknown> };

export async function appendStoryEvent(worldId: string, input: StoryEventInput) {
  const worldRef = db.doc(`worlds/${worldId}`); const eventRef = worldRef.collection('events').doc();
  await db.runTransaction(async transaction => { const world = await transaction.get(worldRef); if (!world.exists) throw new Error('World not found'); const sequenceNumber = world.data()?.nextSequence ?? 1; transaction.set(eventRef, { ...input, actorId: input.actorId ?? null, audienceIds: input.audienceIds ?? [], sceneId: input.sceneId ?? null, payload: input.payload ?? {}, sequenceNumber, createdAt: FieldValue.serverTimestamp() }); transaction.update(worldRef, { nextSequence: sequenceNumber + 1 }); });
  return eventRef.id;
}

export function canSeeEvent(event: Record<string, unknown>, identity: string | string[]) {
  if (event.scope === 'world') return true;
  const audience = Array.isArray(event.audienceIds) ? event.audienceIds : [];
  const identities = Array.isArray(identity) ? identity : [identity];
  return identities.some(uid => audience.includes(uid));
}
