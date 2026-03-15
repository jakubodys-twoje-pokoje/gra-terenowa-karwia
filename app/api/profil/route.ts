import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ userId, nickname: null, email: null, city: null, avatarUrl: null });
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { userId, nickname, email, city, avatarUrl } = body;
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const profile = await prisma.userProfile.upsert({
    where: { userId },
    update: { nickname, email, city, avatarUrl },
    create: { userId, nickname, email, city, avatarUrl },
  });
  return NextResponse.json(profile);
}
