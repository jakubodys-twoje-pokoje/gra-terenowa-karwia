import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'karwia2024';

// GET /api/content?key=regulamin
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Brak klucza' }, { status: 400 });

  const row = await prisma.pageContent.findUnique({ where: { key } });
  return NextResponse.json({ html: row?.html ?? '' });
}

// PUT /api/content?key=regulamin  (admin only)
export async function PUT(req: NextRequest) {
  const adminPwd = req.headers.get('x-admin-password');
  if (adminPwd !== ADMIN_PASSWORD)
    return NextResponse.json({ error: 'Brak dostępu' }, { status: 401 });

  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Brak klucza' }, { status: 400 });

  const { html } = await req.json();
  await prisma.pageContent.upsert({
    where: { key },
    update: { html: html ?? '' },
    create: { key, html: html ?? '' },
  });

  return NextResponse.json({ ok: true });
}
