import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { PRESET_TRAILERS_BY_ID } from '@/lib/preset-trailers';

export const runtime = 'nodejs';

const cacheHeaders = {
  'Content-Type': 'video/mp4',
  'Cache-Control': 'public, max-age=86400, immutable',
  'Accept-Ranges': 'bytes',
};

/** Streams a known preset trailer; route parameters never become filesystem paths. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trailer = PRESET_TRAILERS_BY_ID[id];
  if (!trailer) return new Response('Trailer not found.', { status: 404 });

  const videoPath = join(process.cwd(), 'app', trailer.fileName);
  const { size } = await stat(videoPath);
  const range = request.headers.get('range');

  if (!range) {
    const stream = Readable.toWeb(createReadStream(videoPath)) as ReadableStream;
    return new Response(stream, { headers: { ...cacheHeaders, 'Content-Length': String(size) } });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return new Response(null, { status: 416, headers: { ...cacheHeaders, 'Content-Range': `bytes */${size}` } });

  const start = match[1] ? Number(match[1]) : 0;
  const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { ...cacheHeaders, 'Content-Range': `bytes */${size}` } });
  }

  const stream = Readable.toWeb(createReadStream(videoPath, { start, end })) as ReadableStream;
  return new Response(stream, {
    status: 206,
    headers: { ...cacheHeaders, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${size}` },
  });
}
