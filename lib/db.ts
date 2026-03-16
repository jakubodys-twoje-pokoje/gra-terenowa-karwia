import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma() {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  // better-sqlite3 expects a plain file path, not a "file:" URL
  const url = raw.startsWith('file:') ? raw.slice(5) : raw;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
