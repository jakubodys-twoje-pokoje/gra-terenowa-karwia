import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Brak parametru url' }, { status: 400 });

  const building = await prisma.building.findUnique({
    where: { qrUrl: url },
    select: { id: true, name: true },
  });

  if (!building) return NextResponse.json({ error: 'Budynek nie znaleziony' }, { status: 404 });
  return NextResponse.json(building);
}
