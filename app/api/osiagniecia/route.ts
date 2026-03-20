import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function isUnlocked(
  conditionType: string,
  conditionValue: number,
  conditionCategory: string | null,
  discoveredCount: number,
  totalBuildings: number,
  discoveredCategories: string[],
): boolean {
  switch (conditionType) {
    case 'total_count':
      return discoveredCount >= conditionValue;
    case 'total_all':
      return totalBuildings > 0 && discoveredCount >= totalBuildings;
    case 'category_count': {
      const count = discoveredCategories.filter((c) => c === conditionCategory).length;
      return count >= conditionValue;
    }
    default:
      return false;
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  const [allAchievements, totalBuildings] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { order: 'asc' } }),
    prisma.building.count({ where: { published: true } }),
  ]);

  if (allAchievements.length === 0) {
    // Return empty if not seeded yet
    return NextResponse.json([]);
  }

  let discoveredCount = 0;
  let discoveredCategories: string[] = [];

  if (userId) {
    const discoveries = await prisma.userDiscovery.findMany({
      where: { userId },
      include: { building: { select: { category: true } } },
    });
    discoveredCount = discoveries.length;
    discoveredCategories = discoveries.map((d) => d.building.category);
  }

  const result = allAchievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    color: a.color,
    conditionType: a.conditionType,
    conditionValue: a.conditionValue,
    conditionCategory: a.conditionCategory,
    order: a.order,
    unlocked: isUnlocked(
      a.conditionType,
      a.conditionValue,
      a.conditionCategory,
      discoveredCount,
      totalBuildings,
      discoveredCategories,
    ),
  }));

  return NextResponse.json(result);
}
