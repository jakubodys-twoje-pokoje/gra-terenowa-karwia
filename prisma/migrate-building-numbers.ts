/**
 * prisma/migrate-building-numbers.ts
 *
 * One-time script: fills in `number` for existing buildings by extracting
 * the trailing integer from their qrUrl (e.g. "/domy-z-historia/11" → 11).
 *
 * Run with:
 *   npx tsx prisma/migrate-building-numbers.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const url = raw.startsWith('file:') ? raw.slice(5) : raw;
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const buildings = await prisma.building.findMany({
    select: { id: true, name: true, qrUrl: true, number: true },
  });

  console.log(`Found ${buildings.length} buildings`);

  let updated = 0;
  let skipped = 0;

  for (const b of buildings) {
    if (b.number != null) {
      console.log(`  skip  [${b.id}] ${b.name} — already has number ${b.number}`);
      skipped++;
      continue;
    }

    const match = /(\d+)\/?$/.exec(b.qrUrl);
    if (!match) {
      console.log(`  skip  [${b.id}] ${b.name} — no trailing number in qrUrl: ${b.qrUrl}`);
      skipped++;
      continue;
    }

    const number = parseInt(match[1], 10);
    await prisma.building.update({ where: { id: b.id }, data: { number } });
    console.log(`  set   [${b.id}] ${b.name} → ${number}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
