import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';

/** Serves the local cinematic asset without exposing the rest of app/assets. */
export async function GET() {
  const video = await readFile(join(process.cwd(), 'app', 'assets', 'echoes_of_valor.mp4'));

  return new Response(video, {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
    },
  });
}
