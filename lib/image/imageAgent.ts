import 'server-only';
import OpenAI from 'openai';

export type WorldImageInput = {
  name: string;
  genre: string;
  premise: string;
  tone?: string;
  locations?: { name: string; atmosphere: string }[];
};

function buildPrompt(world: WorldImageInput): string {
  const locationDetails = world.locations?.length
    ? world.locations
      .slice(0, 3)
      .map((l) => `${l.name} (${l.atmosphere})`)
      .join(', ')
    : '';

  return [
    `A cinematic, wide-angle concept art cover illustration for an interactive fiction world.`,
    `Genre: ${world.genre}.`,
    `World name: "${world.name}".`,
    `Premise: ${world.premise}`,
    world.tone ? `Tone and mood: ${world.tone}.` : '',
    locationDetails ? `Key locations: ${locationDetails}.` : '',
    `Style: ultra-detailed digital painting, dramatic lighting, atmospheric perspective, rich textures, muted cinematic color palette with one accent color.`,
    `No text, no logos, no UI elements, no watermarks. Landscape orientation. Evocative and immersive.`,
  ]
    .filter(Boolean)
    .join(' ');
}

export async function generateWorldImage(world: WorldImageInput): Promise<Buffer> {
  const apiKey = process.env.OPENAI_IMAGE_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_IMAGE_API_KEY is not set in environment variables.');
  }

  const client = new OpenAI({ apiKey });
  const prompt = buildPrompt(world);

  const result = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    size: '1536x1024',
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error('OpenAI returned no image data.');
  }

  return Buffer.from(b64, 'base64');
}
