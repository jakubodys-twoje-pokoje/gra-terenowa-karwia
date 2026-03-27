/**
 * Assigns categories to buildings based on historical context.
 * Priority: karczma > sakralny > natura > morze > pensjonat > zagroda > checza > historia
 *
 * Run with: npx tsx prisma/seed-building-categories.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

// Explicit per-building mapping derived from historical context & achievement data
const BUILDING_CATEGORIES: Record<number, string> = {
  // Karczmy / gospody
  43: 'karczma',
  46: 'karczma',
  47: 'karczma',
  52: 'karczma',

  // Sakralne (kościół i kapliczki)
  67: 'sakralny',
  62: 'sakralny',
  51: 'sakralny',

  // Natura / leśniczówka
  41: 'natura',

  // Morze / rybołówstwo
  42: 'morze',
  31: 'morze',

  // Pensjonaty / wille letniskowe
  14: 'pensjonat',
  18: 'pensjonat',
  19: 'pensjonat',
  24: 'pensjonat',
  27: 'pensjonat',
  32: 'pensjonat',
  33: 'pensjonat',
  48: 'pensjonat',
  12: 'pensjonat',

  // Zagrody jednobudynkowe
  49: 'zagroda',
  55: 'zagroda',
  68: 'zagroda',
  69: 'zagroda',

  // Chëcze kaszubskie (chaty)
  2:  'checza',
  11: 'checza',
  13: 'checza',
  25: 'checza',
  40: 'checza',
  45: 'checza',
  54: 'checza',
  57: 'checza',
  59: 'checza',
  63: 'checza',
  64: 'checza',
  66: 'checza',
  21: 'checza',
  58: 'checza',
  60: 'checza',

  // Historia (pozostałe budynki historyczne)
  15: 'historia',
  16: 'historia',
  17: 'historia',
  20: 'historia',
  22: 'historia',
  23: 'historia',
  26: 'historia',
  28: 'historia',
  29: 'historia',
  30: 'historia',
  35: 'historia',
  36: 'historia',
  38: 'historia',
  39: 'historia',
  44: 'historia',
  50: 'historia',
  53: 'historia',
  56: 'historia',
  61: 'historia',
  65: 'historia',
  70: 'historia',
};

async function main() {
  const buildings = await prisma.building.findMany({ select: { id: true, category: true } });
  console.log(`Found ${buildings.length} buildings in DB.`);

  let updated = 0;
  for (const b of buildings) {
    const newCat = BUILDING_CATEGORIES[b.id] ?? 'historia';
    if (b.category !== newCat) {
      await prisma.building.update({ where: { id: b.id }, data: { category: newCat } });
      updated++;
    }
  }

  console.log(`Updated ${updated} buildings with new categories.`);
  await prisma.$disconnect();
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
