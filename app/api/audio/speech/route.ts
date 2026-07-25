import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import type { VoiceProfile } from '@/lib/story/schema';

export const runtime = 'nodejs';
export const maxDuration = 60;

const voices: VoiceProfile['voice'][] = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse', 'marin', 'cedar'];

export async function POST(request: NextRequest) {
  try {
    await requireUser(request);
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Voice narration is not configured.' }, { status: 503 });
    const { text, voice = 'marin', instructions = '' } = await request.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Nothing to narrate.' }, { status: 400 });
    const selectedVoice = voices.includes(voice) ? voice : 'marin';
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audio = await client.audio.speech.create({ model: process.env.TTS_MODEL ?? 'gpt-4o-mini-tts', voice: selectedVoice, input: text.trim().slice(0, 4000), instructions: typeof instructions === 'string' ? instructions.slice(0, 500) : undefined, response_format: 'mp3' });
    return new NextResponse(Buffer.from(await audio.arrayBuffer()), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate narration.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
