import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require('better-sqlite3') as new (path: string) => { exec(sql: string): void; close(): void };

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function dbPath() {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  return raw.startsWith('file:') ? raw.slice(5) : raw;
}

// Additive startup migrations — safe to run on every cold start
function runStartupMigrations(path: string) {
  const db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS "PageView" (
      "id"        INTEGER  PRIMARY KEY AUTOINCREMENT,
      "path"      TEXT     NOT NULL,
      "userId"    TEXT,
      "sessionId" TEXT     NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
    CREATE INDEX IF NOT EXISTS "PageView_path_idx"      ON "PageView"("path");
    CREATE INDEX IF NOT EXISTS "PageView_sessionId_idx" ON "PageView"("sessionId");
  `);
  db.close();
}

function makePrisma() {
  const path = dbPath();
  runStartupMigrations(path);
  const adapter = new PrismaBetterSqlite3({ url: path });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
