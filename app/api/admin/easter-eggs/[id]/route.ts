import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin, unauthorized } from '@/lib/adminAuth';


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { name, title, description, mediaType, mediaUrl, triggerType, triggerValue, triggerBuildingId, active } = body;

  const egg = await prisma.easterEgg.update({
    where: { id: Number(id) },
    data: {
      name: name?.trim(),
      title: title?.trim(),
      description: description?.trim() || null,
      mediaType: mediaType || 'none',
      mediaUrl: mediaUrl?.trim() || null,
      triggerType,
      triggerValue: triggerValue ? Number(triggerValue) : null,
      triggerBuildingId: triggerBuildingId ? Number(triggerBuildingId) : null,
      active: active !== false,
    },
  });
  return NextResponse.json(egg);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id } = await params;
  await prisma.easterEgg.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
