import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import * as schema from "./schema";

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "dashboard.sqlite"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");

const migrationsFolder = path.join(process.cwd(), "lib/db/migrations");

function tableExists(name: string) {
  const row = sqlite
    .prepare(`SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name) as { ok: number } | undefined;
  return Boolean(row);
}

export const db = drizzle(sqlite, { schema });

// `next build` collects page data in parallel workers; migrating a shared file races.
// Runtime (and tests) still apply migrations on boot.
if (!isProductionBuild) {
  if (tableExists("user") && !tableExists("__drizzle_migrations")) {
    const migrations = readMigrationFiles({ migrationsFolder });
    const initial = migrations[0];
    if (initial) {
      sqlite.exec(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        hash text NOT NULL,
        created_at numeric
      )
    `);
      sqlite
        .prepare(`INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)`)
        .run(initial.hash, initial.folderMillis);
    }
  }
  migrate(db, { migrationsFolder });
}
