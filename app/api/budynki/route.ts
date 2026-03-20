import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAdmin = req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD;
  const where = isAdmin ? {} : { published: true };

  try {
    const buildings = await prisma.building.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, description: true, address: true,
        lat: true, lng: true, imageUrl: true, outlineImageUrl: true,
        category: true, qrUrl: true, hidden: true, published: true,
        images: { orderBy: { order: 'asc' }, select: { id: true, url: true, order: true } },
      },
    });
    return NextResponse.json(buildings);
  } catch {
    // Fallback: BuildingImage table may not exist yet on server (run prisma db push)
    const buildings = await prisma.building.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, description: true, address: true,
        lat: true, lng: true, imageUrl: true, outlineImageUrl: true,
        category: true, qrUrl: true, hidden: true, published: true,
      },
    });
    return NextResponse.json(buildings.map((b) => ({ ...b, images: [] })));
  }
}

export async function POST(req: NextRequest) {
  const password = req.headers.get('x-admin-password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, description, address, lat, lng, imageUrl, outlineImageUrl, qrUrl, category, gallery, hidden, published } = body;

  if (!name || !description || lat == null || lng == null || !qrUrl) {
    return NextResponse.json({ error: 'Brakujące pola' }, { status: 400 });
  }

  try {
    const building = await prisma.building.create({
      data: {
        name, description, address, lat: Number(lat), lng: Number(lng),
        imageUrl, outlineImageUrl, qrUrl, category: category || 'landmark',
        hidden: hidden ?? false,
        published: published ?? true,
        images: {
          create: ((gallery as string[] | undefined) ?? [])
            .filter((url) => url.trim())
            .map((url, i) => ({ url: url.trim(), order: i })),
        },
      },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(building, { status: 201 });
  } catch (e: unknown) {
    const isPrismaUniqueError =
      typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002';
    if (isPrismaUniqueError) {
      return NextResponse.json({ error: 'QR URL już istnieje w bazie' }, { status: 409 });
    }
    console.error('Błąd tworzenia budynku:', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
