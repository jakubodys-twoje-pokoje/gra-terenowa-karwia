import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const building = await prisma.building.findUnique({
    where: { id: Number(params.id) },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  if (!building) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
  return NextResponse.json(building);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, address, lat, lng, imageUrl, qrUrl, category, gallery } = body;

  try {
    const building = await prisma.building.update({
      where: { id: Number(params.id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(address !== undefined && { address }),
        ...(lat != null && { lat: Number(lat) }),
        ...(lng != null && { lng: Number(lng) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(qrUrl && { qrUrl }),
        ...(category && { category }),
        ...(gallery !== undefined && {
          images: {
            deleteMany: {},
            create: (gallery as string[])
              .filter((url) => url.trim())
              .map((url, i) => ({ url: url.trim(), order: i })),
          },
        }),
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(building);
  } catch {
    return NextResponse.json({ error: 'Błąd aktualizacji' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.building.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
