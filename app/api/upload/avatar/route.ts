import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const userId = formData.get('userId') as string | null;

  if (!file || !userId) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5 MB' }, { status: 400 });

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png',
    'image/gif': 'gif', 'image/webp': 'webp', 'image/heic': 'jpg', 'image/heif': 'jpg',
  };
  const ext = mimeToExt[file.type] ?? 'jpg';
  // Include timestamp so browser doesn't cache stale version
  const filename = `${userId.replace(/[^a-z0-9-]/gi, '_')}_${Date.now()}.${ext}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/avatars/${filename}` });
}
