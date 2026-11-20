import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin, unauthorized } from '@/lib/adminAuth';


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  const { name, description, icon, color, conditionType, conditionValue, conditionCategory, buildingIds, order } = await req.json();

  const achievement = await prisma.achievement.update({
    where: { id },
    data: {
      name,
      description: description ?? '',
      icon: icon ?? '🏆',
      color: color ?? '#0F5F92',
      conditionType,
      conditionValue: conditionValue ?? 1,
      conditionCategory: conditionCategory || null,
      buildingIds: buildingIds || null,
      order: order ?? 0,
    },
  });
  return NextResponse.json(achievement);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();

  const { id: idStr } = await params;
  await prisma.achievement.delete({ where: { id: parseInt(idStr) } });
  return NextResponse.json({ ok: true });
}
