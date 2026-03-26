import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST { userId, discoveryCount, buildingId? }
// Returns the first easter egg that should fire, or null.
export async function POST(req: NextRequest) {
  const { userId, discoveryCount, buildingId } = await req.json();

  if (!userId || typeof discoveryCount !== 'number') {
    return NextResponse.json(null);
  }

  const eggs = await prisma.easterEgg.findMany({ where: { active: true } });
  if (eggs.length === 0) return NextResponse.json(null);

  const seen = await prisma.easterEggView.findMany({
    where: { userId },
    select: { eggId: true, milestone: true },
  });

  // For one-shot triggers: set of eggIds already seen
  const seenOnce = new Set(seen.filter((s) => s.milestone === 0).map((s) => s.eggId));
  // For every_n: map of eggId → set of milestones already seen
  const seenMilestones: Map<number, Set<number>> = new Map();
  seen.filter((s) => s.milestone > 0).forEach((s) => {
    if (!seenMilestones.has(s.eggId)) seenMilestones.set(s.eggId, new Set());
    seenMilestones.get(s.eggId)!.add(s.milestone);
  });

  let triggeredEgg: typeof eggs[0] | null = null;
  let milestoneToSave = 0;

  for (const egg of eggs) {
    if (egg.triggerType === 'discovery_count') {
      if (!seenOnce.has(egg.id) && egg.triggerValue === discoveryCount) {
        triggeredEgg = egg;
        milestoneToSave = 0;
        break;
      }
    } else if (egg.triggerType === 'every_n') {
      if (!egg.triggerValue || discoveryCount === 0) continue;
      const milestone = Math.floor(discoveryCount / egg.triggerValue);
      if (milestone > 0 && discoveryCount % egg.triggerValue === 0) {
        const alreadySeen = seenMilestones.get(egg.id)?.has(milestone) ?? false;
        if (!alreadySeen) {
          triggeredEgg = egg;
          milestoneToSave = milestone;
          break;
        }
      }
    } else if (egg.triggerType === 'building') {
      if (!seenOnce.has(egg.id) && egg.triggerBuildingId === buildingId) {
        triggeredEgg = egg;
        milestoneToSave = 0;
        break;
      }
    }
  }

  if (!triggeredEgg) return NextResponse.json(null);

  // Mark as seen so it won't fire again for this milestone
  await prisma.easterEggView.upsert({
    where: { userId_eggId_milestone: { userId, eggId: triggeredEgg.id, milestone: milestoneToSave } },
    update: {},
    create: { userId, eggId: triggeredEgg.id, milestone: milestoneToSave },
  });

  return NextResponse.json(triggeredEgg);
}
