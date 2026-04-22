import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const STALE_MINUTES = 5;

export async function GET() {
  const since = new Date(Date.now() - STALE_MINUTES * 60 * 1000);

  const players = await prisma.userProfile.findMany({
    where: {
      showOnMap: true,
      lastLat: { not: null },
      lastLng: { not: null },
      lastSeenAt: { gte: since },
    },
    select: {
      userId: true,
      nickname: true,
      avatarUrl: true,
      lastLat: true,
      lastLng: true,
      lastSeenAt: true,
    },
  });

  return NextResponse.json(players);
}
