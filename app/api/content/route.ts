import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin, unauthorized } from '@/lib/adminAuth';


// GET /api/content?key=regulamin
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Brak klucza' }, { status: 400 });

  const row = await prisma.pageContent.findUnique({ where: { key } });
  return NextResponse.json({ html: row?.html ?? '' });
}

// PUT /api/content?key=regulamin  (admin only)
export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

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
