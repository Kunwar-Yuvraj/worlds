import 'server-only';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

let geminiKeyIndex = 0;

function getGeminiApiKeys(): string[] {
  const keysStr = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return keysStr
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export async function callLLM({
  systemPrompt,
  userPrompt,
  json = false,
}: {
  systemPrompt: string;
  userPrompt: string;
  json?: boolean;
}): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? 'gemini';

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    });
    return result.choices[0]?.message.content ?? '';
  }

  const apiKeys = getGeminiApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('No Gemini API key specified. Set GEMINI_API_KEY or GEMINI_API_KEYS in your environment.');
  }

  // Select key using round-robin rotation across calls
  const startIndex = geminiKeyIndex % apiKeys.length;
  geminiKeyIndex = (geminiKeyIndex + 1) % apiKeys.length;

  let lastError: unknown;
  for (let attempt = 0; attempt < apiKeys.length; attempt++) {
    const currentIndex = (startIndex + attempt) % apiKeys.length;
    const apiKey = apiKeys[currentIndex];

    try {
      const client = new GoogleGenAI({ apiKey });
      const result = await client.models.generateContent({
        model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      });
      return result.text ?? '';
    } catch (err: any) {
      lastError = err;
      const isRateLimit =
        err?.status === 429 ||
        err?.statusCode === 429 ||
        (err?.message &&
          (err.message.includes('429') ||
            err.message.includes('RESOURCE_EXHAUSTED') ||
            err.message.includes('Quota exceeded')));

      if (isRateLimit && apiKeys.length > 1 && attempt < apiKeys.length - 1) {
        console.warn(
          `[Gemini API] Key at index ${currentIndex} rate-limited. Retrying with next available key...`
        );
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

