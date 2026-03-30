/**
 * prisma/migrate-guest-discoveries.ts
 *
 * One-time script: migrates guest discoveries to registered userId
 * for all existing verified users who have guestUserId stored on their profile.
 *
 * Run with:
 *   npx ts-node --project tsconfig.json prisma/migrate-guest-discoveries.ts
 * or (if using tsx):
 *   npx tsx prisma/migrate-guest-discoveries.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.userProfile.findMany({
    where: {
      emailVerified: true,
      guestUserId: { not: null },
    },
    select: { userId: true, nickname: true, guestUserId: true },
  });

  console.log(`Found ${profiles.length} verified users with guestUserId`);

  let migrated = 0;
  let skipped = 0;

  for (const profile of profiles) {
    const guestId = profile.guestUserId!;

    const guestDiscoveries = await prisma.userDiscovery.findMany({
      where: { userId: guestId },
      select: { buildingId: true },
    });

    if (guestDiscoveries.length === 0) {
      skipped++;
      continue;
    }

    console.log(`  → ${profile.nickname ?? profile.userId}: migrating ${guestDiscoveries.length} discoveries from ${guestId}`);

    for (const { buildingId } of guestDiscoveries) {
      await prisma.userDiscovery.upsert({
        where: { userId_buildingId: { userId: profile.userId, buildingId } },
        update: {},
        create: { userId: profile.userId, buildingId },
      });
    }

    await prisma.userDiscovery.deleteMany({ where: { userId: guestId } });
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, skipped (no guest discoveries): ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
