import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { containsProfanity } from '@/lib/profanity';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json(null);
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  // Only authenticated (verified) users can update profile
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { nickname, city, avatarUrl, showOnMap } = body;

  if (nickname !== undefined && nickname !== null) {
    const trimmed = String(nickname).trim();
    if (trimmed.length > 30) return NextResponse.json({ error: 'Pseudonim może mieć maksymalnie 30 znaków.' }, { status: 400 });
  }
  if (containsProfanity(nickname)) return NextResponse.json({ error: 'Pseudonim zawiera niedozwolone słowa.' }, { status: 400 });
  if (containsProfanity(city)) return NextResponse.json({ error: 'Miejscowość zawiera niedozwolone słowa.' }, { status: 400 });

  // Reject dangerous avatar URL protocols (javascript:, data:, etc.)
  if (avatarUrl && typeof avatarUrl === 'string') {
    const proto = avatarUrl.trim().toLowerCase();
    if (proto.startsWith('javascript:') || proto.startsWith('data:') || proto.startsWith('vbscript:')) {
      return NextResponse.json({ error: 'Nieprawidłowy URL avatara.' }, { status: 400 });
    }
  }

  // Only allow updating own profile; email cannot be changed here
  const profile = await prisma.userProfile.update({
    where: { userId: session.userId },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(city !== undefined && { city }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(typeof showOnMap === 'boolean' && { showOnMap }),
    },
  });
  return NextResponse.json(profile);
}
