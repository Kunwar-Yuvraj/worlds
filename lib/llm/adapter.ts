import 'server-only';
import OpenAI from 'openai';

let client: OpenAI | null = null;

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('No OpenAI API key specified. Set OPENAI_API_KEY in your environment.');
  }

  client ??= new OpenAI({ apiKey });
  return client;
}

export async function callLLM({
  systemPrompt,
  userPrompt,
  json = false,
  maxOutputTokens,
}: {
  systemPrompt: string;
  userPrompt: string;
  json?: boolean;
  maxOutputTokens?: number;
}): Promise<string> {
  const result = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    ...(maxOutputTokens ? { max_completion_tokens: maxOutputTokens } : {}),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });

  const content = result.choices[0]?.message.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }
  return content;
}
