import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const buildings = await prisma.building.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true, name: true, description: true, address: true,
      lat: true, lng: true, imageUrl: true, category: true, qrUrl: true,
      images: { orderBy: { order: 'asc' }, select: { id: true, url: true, order: true } },
    },
  });
  return NextResponse.json(buildings);
}

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, address, lat, lng, imageUrl, qrUrl, category, gallery } = body;

  if (!name || !description || lat == null || lng == null || !qrUrl) {
    return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 });
  }

  try {
    const building = await prisma.building.create({
      data: {
        name, description, address, lat: Number(lat), lng: Number(lng),
        imageUrl, qrUrl, category: category || 'landmark',
        images: {
          create: ((gallery as string[] | undefined) ?? [])
            .filter((url) => url.trim())
            .map((url, i) => ({ url: url.trim(), order: i })),
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(building, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'QR URL już istnieje w bazie' }, { status: 409 });
  }
}
