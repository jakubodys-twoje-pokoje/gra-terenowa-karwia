import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const currentUserId = req.nextUrl.searchParams.get('userId') ?? '';

  // Count discoveries per user
  const counts = await prisma.userDiscovery.groupBy({
    by: ['userId'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 100,
  });

  // Get profiles for all these users
  const userIds = counts.map((c) => c.userId);
  const profiles = await prisma.userProfile.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, nickname: true, city: true, avatarUrl: true },
  });
  const profileMap = Object.fromEntries(profiles.map((p) => [p.userId, p]));

  const ranking = counts.map((c, i) => {
    const profile = profileMap[c.userId];
    return {
      rank: i + 1,
      userId: c.userId,
      nickname: profile?.nickname ?? null,
      city: profile?.city ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      discoveryCount: c._count.id,
      isCurrentUser: c.userId === currentUserId,
    };
  });

  // Find current user's rank if not in top 100
  const currentUserEntry = ranking.find((r) => r.isCurrentUser);
  let currentUserRank: typeof ranking[0] | null = null;
  if (!currentUserEntry && currentUserId) {
    const userCount = await prisma.userDiscovery.count({ where: { userId: currentUserId } });
    if (userCount > 0) {
      const betterCount = await prisma.userDiscovery.groupBy({
        by: ['userId'],
        _count: { id: true },
        having: { id: { _count: { gt: userCount } } },
      });
      const profile = await prisma.userProfile.findUnique({ where: { userId: currentUserId } });
      currentUserRank = {
        rank: betterCount.length + 1,
        userId: currentUserId,
        nickname: profile?.nickname ?? null,
        city: profile?.city ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
        discoveryCount: userCount,
        isCurrentUser: true,
      };
    }
  }

  return NextResponse.json({ ranking: ranking.slice(0, 50), currentUser: currentUserEntry ?? currentUserRank });
}
