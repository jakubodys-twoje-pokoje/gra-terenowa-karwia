import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string | null;

  if (!file || !userId) return NextResponse.json({ error: 'Brak danych' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Tylko obrazy są dozwolone' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Maksymalny rozmiar to 5 MB' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  // Resize to max 400×400, convert to WebP, strip all metadata (EXIF/GPS)
  let processed: Buffer;
  try {
    processed = await sharp(buffer)
      .rotate()                          // auto-rotate based on EXIF orientation
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .webp({ quality: 82 })
      .withMetadata({})                  // strip all metadata
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Nie udało się przetworzyć obrazu — sprawdź czy plik nie jest uszkodzony' }, { status: 422 });
  }

  const safeUserId = userId.replace(/[^a-z0-9-]/gi, '_');
  const filename = `${safeUserId}_${Date.now()}.webp`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), processed);

  // Return processed image as base64 data URL for immediate client display
  // (no 2nd HTTP request, no race condition), plus the API URL for DB storage.
  // Using /api/avatars/ route (not /uploads/) so Nginx always proxies to Next.js.
  const dataUrl = `data:image/webp;base64,${processed.toString('base64')}`;

  return NextResponse.json({ url: `/api/avatars/${filename}`, dataUrl });
}
