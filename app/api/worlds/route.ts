import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
export const runtime = 'nodejs';
export async function GET() { const snap = await db.collection('worlds').where('visibility', '==', 'public').limit(20).get(); return NextResponse.json({ worlds: snap.docs.map(d => ({ id: d.id, name: d.data().name, genre: d.data().genre, rulesText: d.data().worldParameters?.rulesText ?? '', premise: d.data().worldParameters?.premise ?? '', turnCount: d.data().turnCount })) }); }
