import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { haversineKm } from '@/lib/haversine';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const building = await prisma.building.findUnique({ where: { id: Number(params.id) } });
  if (!building) return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });

  const all = await prisma.building.findMany({
    where: { id: { not: building.id }, published: true },
    select: { id: true, name: true, lat: true, lng: true, category: true, imageUrl: true, outlineImageUrl: true },
  });

  const withDistance = all
    .map((b) => ({ ...b, distanceKm: haversineKm(building.lat, building.lng, b.lat, b.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  return NextResponse.json(withDistance);
}
