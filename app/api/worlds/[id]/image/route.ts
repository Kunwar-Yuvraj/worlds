import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import '@/lib/firebase/admin';
import { db } from '@/lib/firebase/admin';
import { generateWorldImage, type WorldImageInput } from '@/lib/image/imageAgent';

export const runtime = 'nodejs';
export const maxDuration = 60;

/* Path to local covers directory inside public/ */
const COVERS_DIR = path.join(process.cwd(), 'public', 'covers');

/* Normalize a genre string into a safe filename slug (e.g. "Murder Mystery" -> "murder-mystery") */
function getGenreSlug(genre: string): string {
  const slug = genre.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || 'general';
}

/* Save image buffer to local disk for both genre slug and world ID */
async function saveCoverImage(genre: string, worldId: string, imageBuffer: Buffer): Promise<string> {
  await fs.mkdir(COVERS_DIR, { recursive: true });
  const genreSlug = getGenreSlug(genre);
  const genrePath = path.join(COVERS_DIR, `genre-${genreSlug}.png`);
  const worldPath = path.join(COVERS_DIR, `${worldId}.png`);

  // Save as genre image and world image
  await Promise.all([
    fs.writeFile(genrePath, imageBuffer),
    fs.writeFile(worldPath, imageBuffer),
  ]);

  return `/covers/genre-${genreSlug}.png`;
}

/* Read image buffer from local disk (checks genre file first, then worldId file) */
async function readCoverImage(genre?: string, worldId?: string): Promise<Buffer | null> {
  if (genre) {
    const genreSlug = getGenreSlug(genre);
    const genrePath = path.join(COVERS_DIR, `genre-${genreSlug}.png`);
    try {
      await fs.access(genrePath);
      return await fs.readFile(genrePath);
    } catch {
      // Not found by genre, continue to check worldId
    }
  }

  if (worldId) {
    const worldPath = path.join(COVERS_DIR, `${worldId}.png`);
    try {
      await fs.access(worldPath);
      return await fs.readFile(worldPath);
    } catch {
      // Not found by worldId
    }
  }

  return null;
}

/* Build WorldImageInput from Firestore world data */
function extractImageInput(worldData: Record<string, unknown>): WorldImageInput | null {
  const name = worldData.name as string | undefined;
  const genre = worldData.genre as string | undefined;
  const params = worldData.worldParameters as Record<string, unknown> | undefined;
  const premise = (params?.premise as string) || (worldData.worldSummary as string) || '';
  if (!name || !genre || !premise) return null;
  return {
    name,
    genre,
    premise,
    tone: (params?.tone as string) || undefined,
  };
}

/* GET — serve cover image based on genre cache first, then generate if missing */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Try reading directly from world document in Firestore to know genre
    const worldRef = db.doc(`worlds/${id}`);
    const worldSnap = await worldRef.get();
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 });

    const worldData = worldSnap.data()!;
    const genre = worldData.genre as string | undefined;

    // 2. Check if an image for this genre (or world ID) already exists on local disk
    const existingBuffer = await readCoverImage(genre, id);
    if (existingBuffer) {
      return new NextResponse(new Uint8Array(existingBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // 3. Auto-trigger background generation for this genre if not already pending
    if (!worldData.coverImagePending) {
      const imageInput = extractImageInput(worldData);
      if (imageInput) {
        worldRef.update({ coverImagePending: true }).catch(() => {});
        generateWorldImage(imageInput)
          .then(async (imageBuffer) => {
            const relPath = await saveCoverImage(imageInput.genre, id, imageBuffer);
            await worldRef.update({ hasCoverImage: true, coverImagePath: relPath, coverImagePending: false });
            console.log(`[Image Agent] Cover image generated and saved for genre "${imageInput.genre}"`);
          })
          .catch((err) => {
            worldRef.update({ coverImagePending: false }).catch(() => {});
            console.error(`[Image Agent] Failed to generate cover for genre "${imageInput.genre}":`, err);
          });
      }
    }

    return NextResponse.json({ error: 'Genre image is being generated. Please retry shortly.' }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load image.' }, { status: 500 });
  }
}

/* POST — check genre image cache, generate if missing, save locally */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: WorldImageInput = await request.json();

    if (!body.name || !body.genre || !body.premise) {
      return NextResponse.json({ error: 'name, genre, and premise are required.' }, { status: 400 });
    }

    const worldRef = db.doc(`worlds/${id}`);
    const worldSnap = await worldRef.get();
    if (!worldSnap.exists) return NextResponse.json({ error: 'World not found.' }, { status: 404 });

    // Check if an image for this genre already exists on local disk
    const existing = await readCoverImage(body.genre, id);
    if (existing) {
      const genreSlug = getGenreSlug(body.genre);
      const relPath = `/covers/genre-${genreSlug}.png`;
      await worldRef.update({ hasCoverImage: true, coverImagePath: relPath, coverImagePending: false });
      return NextResponse.json({ success: true, skipped: true, path: relPath });
    }

    // Generate & save new genre image
    const imageBuffer = await generateWorldImage(body);
    const relPath = await saveCoverImage(body.genre, id, imageBuffer);

    await worldRef.update({ hasCoverImage: true, coverImagePath: relPath, coverImagePending: false });

    return NextResponse.json({ success: true, path: relPath }, { status: 201 });
  } catch (error) {
    console.error('[Image Agent] Failed to generate cover image:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Image generation failed.' }, { status: 500 });
  }
}
