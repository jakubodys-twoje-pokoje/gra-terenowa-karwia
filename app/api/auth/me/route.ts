import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.userId },
    select: { userId: true, email: true, nickname: true, city: true, avatarUrl: true },
  });
  return NextResponse.json(profile ?? null);
}
