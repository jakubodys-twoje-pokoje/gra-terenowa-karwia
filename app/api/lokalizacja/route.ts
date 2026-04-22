import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { lat, lng } = await req.json();
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return NextResponse.json({ error: 'Invalid coords' }, { status: 400 });
  }

  await prisma.userProfile.update({
    where: { userId: session.userId },
    data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// Turn off location sharing (called on page unload / toggle off)
export async function DELETE(_req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true });

  await prisma.userProfile.update({
    where: { userId: session.userId },
    data: { lastSeenAt: null, lastLat: null, lastLng: null },
  });

  return NextResponse.json({ ok: true });
}
