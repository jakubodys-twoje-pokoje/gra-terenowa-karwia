import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3');
      const dbUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
      return new PrismaBetterSqlite3({ url: dbUrl });
    },
  },
});
