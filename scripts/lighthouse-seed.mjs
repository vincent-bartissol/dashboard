import { createHmac, randomBytes, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = process.env.DATA_DIR;
const secret = process.env.BETTER_AUTH_SECRET;

if (!dataDir || !secret) {
  console.error("DATA_DIR and BETTER_AUTH_SECRET are required");
  process.exit(1);
}

const dbPath = path.join(path.resolve(dataDir), "dashboard.sqlite");
if (!fs.existsSync(dbPath)) {
  console.error(`SQLite file not found: ${dbPath}`);
  process.exit(1);
}

const sqlite = new Database(dbPath);
const now = Math.floor(Date.now() / 1000);
const expires = now + 60 * 60 * 24 * 7;
const userId = randomUUID();
const sessionId = randomUUID();
const token = randomBytes(32).toString("base64url");

sqlite
  .prepare(
    `INSERT INTO user (id, name, email, email_verified, two_factor_enabled, created_at, updated_at)
     VALUES (?, 'Lighthouse', 'lighthouse@localhost', 1, 0, ?, ?)`,
  )
  .run(userId, now, now);

sqlite
  .prepare(
    `INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  .run(sessionId, expires, token, now, now, userId);

sqlite.close();

const signature = createHmac("sha256", secret).digest("base64");
const cookieValue = `${token}.${signature}`;

if (process.env.GITHUB_ENV) {
  fs.appendFileSync(
    process.env.GITHUB_ENV,
    `LHCI_SESSION_COOKIE<<EOF\n${cookieValue}\nEOF\n`,
  );
}

process.stdout.write(`${cookieValue}\n`);
