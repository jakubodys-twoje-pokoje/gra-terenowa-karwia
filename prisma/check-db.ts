import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: './prisma/dev.db' }) });
  const [buildings, users, discoveries, categories, achievements, eggs] = await Promise.all([
    prisma.building.count(),
    prisma.userProfile.count(),
    prisma.userDiscovery.count(),
    prisma.category.count(),
    prisma.achievement.count(),
    prisma.easterEgg.count(),
  ]);
  console.log('buildings:   ', buildings);
  console.log('users:       ', users);
  console.log('discoveries: ', discoveries);
  console.log('categories:  ', categories);
  console.log('achievements:', achievements);
  console.log('easter_eggs: ', eggs);
  await prisma.$disconnect();
}
main();
