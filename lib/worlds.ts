import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase/admin';
import type { Event } from '@/lib/types';
export async function appendEvent(worldId: string, event: Omit<Event, 'sequenceNumber'>) { const worldRef = db.doc(`worlds/${worldId}`); const eventRef = db.collection(`worlds/${worldId}/events`).doc(); await db.runTransaction(async tx => { const world = await tx.get(worldRef); if (!world.exists) throw new Error('World not found'); const sequenceNumber = world.data()?.nextSequence ?? 1; tx.set(eventRef, { ...event, sequenceNumber, createdAt: FieldValue.serverTimestamp() }); tx.update(worldRef, { nextSequence: sequenceNumber + 1 }); }); }
