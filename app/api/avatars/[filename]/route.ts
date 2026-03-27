import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Prevent path traversal
  const safe = path.basename(filename);
  if (!safe || safe !== filename) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', 'avatars', safe);

  let data: Buffer;
  try {
    data = await readFile(filePath);
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = safe.split('.').pop()?.toLowerCase();
  const mime = ext === 'webp' ? 'image/webp' : ext === 'png' ? 'image/png' : 'image/jpeg';

  return new NextResponse(data.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
