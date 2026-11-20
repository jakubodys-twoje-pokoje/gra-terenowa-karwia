import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin, unauthorized } from '@/lib/adminAuth';


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  const { value, label, icon, order } = await req.json();

  try {
    const cat = await prisma.category.update({
      where: { id },
      data: { value, label, icon: icon ?? '', order: order ?? 0 },
    });
    return NextResponse.json(cat);
  } catch {
    return NextResponse.json({ error: 'Błąd zapisu' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id: idStr } = await params;
  await prisma.category.delete({ where: { id: parseInt(idStr) } });
  return NextResponse.json({ ok: true });
}
