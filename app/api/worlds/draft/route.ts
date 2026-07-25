import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { callLLM } from '@/lib/llm/adapter';
import { WORLD_DRAFT_SYSTEM } from '@/lib/story/prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: NextRequest) { try { await requireUser(request); const { description } = await request.json(); if (!description?.trim()) return NextResponse.json({ error: 'Describe the kind of world you want first.' }, { status: 400 }); try { const draft = await callLLM({ systemPrompt: WORLD_DRAFT_SYSTEM, userPrompt: `CREATOR IDEA:\n${description}`, json: true }); return NextResponse.json(JSON.parse(draft.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim())); } catch { return NextResponse.json({ error: 'The world architect is temporarily unavailable. Please retry shortly.' }, { status: 503 }); } } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to generate world parameters.' }, { status: 401 }); } }
