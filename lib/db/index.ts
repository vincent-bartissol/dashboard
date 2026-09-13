import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, "dashboard.sqlite"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    email_verified INTEGER NOT NULL,
    two_factor_enabled INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY NOT NULL,
    expires_at INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    access_token_expires_at INTEGER,
    refresh_token_expires_at INTEGER,
    scope TEXT,
    password TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS two_factor (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    backup_codes TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    failed_verification_count INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER
  );
  CREATE INDEX IF NOT EXISTS two_factor_user_id_idx ON two_factor(user_id);
  CREATE INDEX IF NOT EXISTS two_factor_secret_idx ON two_factor(secret);
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY NOT NULL,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
  );
  CREATE TABLE IF NOT EXISTS favorite (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    dataset_id TEXT NOT NULL,
    record_id TEXT NOT NULL,
    label TEXT NOT NULL,
    geo TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS favorite_user_dataset_record
    ON favorite(user_id, dataset_id, record_id);
  CREATE TABLE IF NOT EXISTS profile (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    arrondissement TEXT
  );
`);

const profileColumns = new Set(
  sqlite.prepare("PRAGMA table_info(profile)").all().map((column) => {
    return (column as { name: string }).name;
  }),
);
if (!profileColumns.has("first_name")) {
  sqlite.exec("ALTER TABLE profile ADD COLUMN first_name TEXT");
}
if (!profileColumns.has("last_name")) {
  sqlite.exec("ALTER TABLE profile ADD COLUMN last_name TEXT");
}

const userColumns = new Set(
  sqlite.prepare("PRAGMA table_info(user)").all().map((column) => {
    return (column as { name: string }).name;
  }),
);
if (!userColumns.has("two_factor_enabled")) {
  sqlite.exec("ALTER TABLE user ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0");
}

sqlite.exec("UPDATE user SET two_factor_enabled = 1 WHERE two_factor_enabled = 0");
sqlite.exec(`
  INSERT INTO two_factor (id, user_id, secret, backup_codes, verified, failed_verification_count)
  SELECT lower(hex(randomblob(16))), id, '', '[]', 0, 0
  FROM user
  WHERE id NOT IN (SELECT user_id FROM two_factor)
`);

export const db = drizzle(sqlite, { schema });
