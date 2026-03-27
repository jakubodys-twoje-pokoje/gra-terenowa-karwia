import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Discovery {
  buildingId: number;
  discoveredAt: Date;
  building: { category: string };
}

function isUnlocked(
  a: { conditionType: string; conditionValue: number; conditionCategory: string | null; buildingIds: string | null },
  discoveredCount: number,
  totalBuildings: number,
  discoveries: Discovery[],
): boolean {
  const discoveredBuildingIds = new Set(discoveries.map((d) => d.buildingId));

  switch (a.conditionType) {
    case 'total_count':
      return discoveredCount >= a.conditionValue;

    case 'total_all':
      return totalBuildings > 0 && discoveredCount >= totalBuildings;

    case 'category_count': {
      const count = discoveries.filter((d) => d.building.category === a.conditionCategory).length;
      return count >= a.conditionValue;
    }

    case 'building_set': {
      const ids: number[] = JSON.parse(a.buildingIds ?? '[]');
      const found = ids.filter((id) => discoveredBuildingIds.has(id)).length;
      return found >= a.conditionValue;
    }

    case 'days_active': {
      const days = new Set(discoveries.map((d) => d.discoveredAt.toISOString().slice(0, 10)));
      return days.size >= a.conditionValue;
    }

    case 'all_in_one_day': {
      // All discoveries (at least 1) happened on the same calendar day
      if (discoveries.length === 0) return false;
      const days = new Set(discoveries.map((d) => d.discoveredAt.toISOString().slice(0, 10)));
      return days.size === 1 && totalBuildings > 0 && discoveredCount >= totalBuildings;
    }

    case 'return_after_break': {
      // At least 2 discoveries with a gap of >= 7 days between any two
      if (discoveries.length < 2) return false;
      const sorted = [...discoveries].sort((a, b) => +a.discoveredAt - +b.discoveredAt);
      for (let i = 1; i < sorted.length; i++) {
        const diffDays = (+sorted[i].discoveredAt - +sorted[i - 1].discoveredAt) / 86400000;
        if (diffDays >= 7) return true;
      }
      return false;
    }

    default:
      return false;
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  let allAchievements: Awaited<ReturnType<typeof prisma.achievement.findMany>>;
  let totalBuildings: number;
  try {
    [allAchievements, totalBuildings] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { order: 'asc' } }),
      prisma.building.count({ where: { published: true } }),
    ]);
  } catch (err) {
    console.error('[/api/osiagniecia] DB error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  if (allAchievements.length === 0) return NextResponse.json([]);

  let discoveries: Discovery[] = [];

  if (userId) {
    discoveries = await prisma.userDiscovery.findMany({
      where: { userId },
      include: { building: { select: { category: true } } },
    });
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
    buildingIds: a.buildingIds,
    order: a.order,
    unlocked: isUnlocked(a, discoveries.length, totalBuildings, discoveries),
  }));

  return NextResponse.json(result);
}
