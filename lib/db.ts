import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makePrisma() {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  const dbPath = dbUrl.replace(/^file:/, '');
  const adapter = new PrismaBetterSqlite3(new Database(dbPath));
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
