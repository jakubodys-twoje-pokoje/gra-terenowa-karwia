import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** GET /api/odkrycia?userId=xxx  – returns all discoveries for a user */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Brak userId' }, { status: 400 });

  const discoveries = await prisma.userDiscovery.findMany({
    where: { userId },
    include: {
      building: {
        select: {
          id: true, name: true, description: true, lat: true, lng: true,
          imageUrl: true, category: true, address: true,
        },
      },
    },
    orderBy: { discoveredAt: 'desc' },
  });

  return NextResponse.json(discoveries);
}

/** POST /api/odkrycia  – mark a building as discovered */
export async function POST(req: NextRequest) {
  const { userId, buildingId } = await req.json();
  if (!userId || !buildingId) {
    return NextResponse.json({ error: 'Brak userId lub buildingId' }, { status: 400 });
  }

  const building = await prisma.building.findUnique({
    where: { id: Number(buildingId) },
    select: { id: true, published: true },
  });
  if (!building) return NextResponse.json({ error: 'Budynek nie istnieje' }, { status: 404 });
  if (!building.published) return NextResponse.json({ error: 'Budynek nie jest opublikowany' }, { status: 403 });

  // Check existence BEFORE upsert so we can report whether it was already discovered
  const existing = await prisma.userDiscovery.findUnique({
    where: { userId_buildingId: { userId, buildingId: Number(buildingId) } },
    select: { id: true },
  });

  const discovery = await prisma.userDiscovery.upsert({
    where: { userId_buildingId: { userId, buildingId: Number(buildingId) } },
    update: {},
    create: { userId, buildingId: Number(buildingId) },
  });

  return NextResponse.json({ ...discovery, alreadyDiscovered: !!existing });
}
