import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const currentUserId = req.nextUrl.searchParams.get('userId') ?? '';

  // Only verified registered users appear in ranking
  const verifiedProfiles = await prisma.userProfile.findMany({
    where: { emailVerified: true, email: { not: null } },
    select: { userId: true, nickname: true, city: true, avatarUrl: true },
  });
  const profileMap = Object.fromEntries(verifiedProfiles.map((p) => [p.userId, p]));
  const verifiedUserIds = Object.keys(profileMap);

  if (verifiedUserIds.length === 0) {
    return NextResponse.json({ ranking: [], currentUser: null });
  }

  const counts = await prisma.userDiscovery.groupBy({
    by: ['userId'],
    where: { userId: { in: verifiedUserIds } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 100,
  });

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

  // Find current user's rank if not in top 50
  const currentUserEntry = ranking.find((r) => r.isCurrentUser);
  let currentUserRank: typeof ranking[0] | null = null;

  if (!currentUserEntry && currentUserId && verifiedUserIds.includes(currentUserId)) {
    const userCount = await prisma.userDiscovery.count({ where: { userId: currentUserId } });
    if (userCount > 0) {
      const betterCount = await prisma.userDiscovery.groupBy({
        by: ['userId'],
        where: { userId: { in: verifiedUserIds } },
        _count: { id: true },
        having: { id: { _count: { gt: userCount } } },
      });
      const profile = profileMap[currentUserId];
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
