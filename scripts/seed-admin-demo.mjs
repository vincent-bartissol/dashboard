import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const SEED_DOMAIN = "seed.local";
const reset = process.argv.includes("--reset");

const dataDir = process.env.DATA_DIR ?? "./data";
const authUrl = process.env.BETTER_AUTH_URL ?? "";

if (authUrl.includes("dashboard.vvbb.fr") && process.env.SEED_ALLOW_PROD !== "1") {
  console.error(
    "Refusing to seed production-looking BETTER_AUTH_URL. Set SEED_ALLOW_PROD=1 to override.",
  );
  process.exit(1);
}

const dbPath = path.join(path.resolve(dataDir), "dashboard.sqlite");
if (!fs.existsSync(dbPath)) {
  console.error(`SQLite file not found: ${dbPath}`);
  process.exit(1);
}

const PAGE_PATHS = [
  "/dashboard",
  "/dashboard/montreuil",
  "/dashboard/velib",
  "/dashboard/nature",
  "/dashboard/air",
  "/dashboard/amenities",
  "/dashboard/events",
  "/dashboard/traffic",
  "/dashboard/markets",
  "/dashboard/favorites",
  "/dashboard/profile",
];

const FAVORITE_POOL = [
  {
    datasetId: "velib-disponibilite-en-temps-reel",
    label: "Centenaire - Sorins",
    geo: JSON.stringify({ lat: 48.85, lon: 2.37 }),
  },
  {
    datasetId: "fontaines-a-boire",
    label: "AVENUE DE SAINT MANDE",
    geo: JSON.stringify({ lat: 48.845, lon: 2.41 }),
  },
  {
    datasetId: "que-faire-a-paris-",
    label: "Contes girafons",
    geo: null,
  },
  {
    datasetId: "les-arbres",
    label: "Platane — Quai de la Seine",
    geo: JSON.stringify({ lat: 48.886, lon: 2.372 }),
  },
  {
    datasetId: "marches-decouverts",
    label: "Marché d'Aligre",
    geo: null,
  },
  {
    datasetId: "espaces_verts",
    label: "Parc des Buttes-Chaumont",
    geo: JSON.stringify({ lat: 48.88, lon: 2.383 }),
  },
];

const SEED_USERS = [
  { email: `alice@${SEED_DOMAIN}`, firstName: "Alice", lastName: "Martin", arr: "11" },
  { email: `bruno@${SEED_DOMAIN}`, firstName: "Bruno", lastName: "Dupont", arr: "15" },
  { email: `chloe@${SEED_DOMAIN}`, firstName: "Chloé", lastName: "Bernard", arr: "03" },
  { email: `diego@${SEED_DOMAIN}`, firstName: "Diego", lastName: "Lopez", arr: "montreuil" },
  { email: `emma@${SEED_DOMAIN}`, firstName: "Emma", lastName: "Petit", arr: "07" },
];

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
];

const IPS = ["82.64.12.10", "86.245.33.91", "90.15.200.44", "2a01:e0a:abc:1234::1"];

function stableId(prefix, ...parts) {
  const digest = createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 24);
  return `${prefix}${digest}`;
}

function daysAgo(days, jitterSec = 0) {
  return Math.floor(Date.now() / 1000) - Math.floor(days * 86_400) - jitterSec;
}

const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

const now = Math.floor(Date.now() / 1000);

if (reset) {
  const deletedUsers = sqlite
    .prepare(`DELETE FROM user WHERE email LIKE ?`)
    .run(`%@${SEED_DOMAIN}`).changes;
  const deletedSessions = sqlite
    .prepare(`DELETE FROM session WHERE id LIKE 'seed-sess-%'`)
    .run().changes;
  const deletedFavorites = sqlite
    .prepare(`DELETE FROM favorite WHERE id LIKE 'seed-fav-%' OR record_id LIKE 'seed-demo-%'`)
    .run().changes;
  const deletedActivity = sqlite
    .prepare(`DELETE FROM activity WHERE id LIKE 'seed-act-%'`)
    .run().changes;
  console.log(
    `Reset: removed ${deletedUsers} seed users, ${deletedSessions} seed sessions, ${deletedFavorites} seed favorites, ${deletedActivity} seed activities`,
  );
}

const insertUser = sqlite.prepare(`
  INSERT INTO user (id, name, email, email_verified, two_factor_enabled, role, banned, created_at, updated_at)
  VALUES (@id, @name, @email, 1, 1, 'user', 0, @createdAt, @updatedAt)
`);

const insertTwoFactor = sqlite.prepare(`
  INSERT INTO two_factor (id, user_id, secret, backup_codes, verified, failed_verification_count)
  VALUES (?, ?, '', '[]', 0, 0)
`);

const upsertProfile = sqlite.prepare(`
  INSERT INTO profile (user_id, first_name, last_name, arrondissement)
  VALUES (@userId, @firstName, @lastName, @arr)
  ON CONFLICT(user_id) DO UPDATE SET
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    arrondissement = excluded.arrondissement
`);

const insertSession = sqlite.prepare(`
  INSERT OR IGNORE INTO session (id, expires_at, token, created_at, updated_at, ip_address, user_agent, user_id)
  VALUES (@id, @expiresAt, @token, @createdAt, @updatedAt, @ip, @ua, @userId)
`);

const insertFavorite = sqlite.prepare(`
  INSERT OR IGNORE INTO favorite (id, user_id, dataset_id, record_id, label, geo, created_at)
  VALUES (@id, @userId, @datasetId, @recordId, @label, @geo, @createdAt)
`);

const insertActivity = sqlite.prepare(`
  INSERT OR IGNORE INTO activity (id, user_id, action, metadata, created_at)
  VALUES (@id, @userId, @action, @metadata, @createdAt)
`);

const ensureSeedUser = sqlite.transaction((spec) => {
  const existing = sqlite.prepare(`SELECT id FROM user WHERE email = ?`).get(spec.email);
  const userId = existing?.id ?? stableId("seed-user-", spec.email);
  const createdAt = daysAgo(20 + (spec.email.length % 10));

  if (!existing) {
    insertUser.run({
      id: userId,
      name: `${spec.firstName} ${spec.lastName}`,
      email: spec.email,
      createdAt,
      updatedAt: createdAt,
    });
    insertTwoFactor.run(stableId("seed-2fa-", userId), userId);
  }

  upsertProfile.run({
    userId,
    firstName: spec.firstName,
    lastName: spec.lastName,
    arr: spec.arr,
  });

  return { userId, createdAt: existing ? daysAgo(14) : createdAt, isNew: !existing };
});

function seedSessionsForUser(userId, index) {
  const count = 1 + (index % 3);
  for (let i = 0; i < count; i++) {
    const live = i === 0;
    const createdAt = daysAgo(live ? 0.5 : 3 + i * 2, i * 90);
    const expiresAt = live ? now + 60 * 60 * 24 * 7 : createdAt + 60 * 60 * 24;
    insertSession.run({
      id: stableId("seed-sess-", userId, String(i)),
      expiresAt,
      token: `seed-token-${createHash("sha256").update(`${userId}:${i}`).digest("hex").slice(0, 40)}`,
      createdAt,
      updatedAt: createdAt,
      ip: IPS[(index + i) % IPS.length],
      ua: USER_AGENTS[(index + i) % USER_AGENTS.length],
      userId,
    });
  }
}

function seedFavoritesForUser(userId, index) {
  const picks = FAVORITE_POOL.filter((_, i) => (i + index) % 2 === 0).slice(0, 3);
  for (const [j, fav] of picks.entries()) {
    const recordId = `seed-demo-${index}-${j}`;
    insertFavorite.run({
      id: stableId("seed-fav-", userId, recordId),
      userId,
      datasetId: fav.datasetId,
      recordId,
      label: fav.label,
      geo: fav.geo,
      createdAt: daysAgo(1 + j * 2, j * 30),
    });
    insertActivity.run({
      id: stableId("seed-act-", userId, "favorite.add", recordId),
      userId,
      action: "favorite.add",
      metadata: JSON.stringify({
        datasetId: fav.datasetId,
        recordId,
        label: fav.label,
      }),
      createdAt: daysAgo(1 + j * 2, j * 30),
    });
  }
}

function seedActivityForUser(userId, index, signupAt) {
  insertActivity.run({
    id: stableId("seed-act-", userId, "signup"),
    userId,
    action: "signup",
    metadata: null,
    createdAt: signupAt,
  });

  for (let i = 0; i < 3; i++) {
    insertActivity.run({
      id: stableId("seed-act-", userId, "login", String(i)),
      userId,
      action: "login",
      metadata: null,
      createdAt: daysAgo(i * 2 + 0.2, index * 17 + i),
    });
  }

  const pathCount = 4 + (index % 4);
  for (let i = 0; i < pathCount; i++) {
    const pathHref = PAGE_PATHS[(index + i) % PAGE_PATHS.length];
    insertActivity.run({
      id: stableId("seed-act-", userId, "page.view", pathHref, String(i)),
      userId,
      action: "page.view",
      metadata: JSON.stringify({ path: pathHref }),
      createdAt: daysAgo(i * 0.7 + 0.1, index * 11 + i * 5),
    });
  }

  insertActivity.run({
    id: stableId("seed-act-", userId, "profile.update"),
    userId,
    action: "profile.update",
    metadata: JSON.stringify({ arrondissement: SEED_USERS[index % SEED_USERS.length]?.arr ?? "11" }),
    createdAt: daysAgo(4, index * 3),
  });
}

const enrichExisting = sqlite.transaction((userId, index) => {
  seedSessionsForUser(userId, index);
  seedFavoritesForUser(userId, index);
  seedActivityForUser(userId, index, daysAgo(12 + (index % 5)));
});

let createdSeedUsers = 0;
const seedUserIds = [];

for (const [index, spec] of SEED_USERS.entries()) {
  const { userId, createdAt, isNew } = ensureSeedUser(spec);
  if (isNew) createdSeedUsers += 1;
  seedUserIds.push(userId);
  enrichExisting(userId, index);
}

const existingUsers = sqlite
  .prepare(`SELECT id FROM user WHERE email NOT LIKE ? ORDER BY created_at ASC`)
  .all(`%@${SEED_DOMAIN}`);

let enrichedExisting = 0;
for (const [index, row] of existingUsers.entries()) {
  enrichExisting(row.id, index + SEED_USERS.length);
  enrichedExisting += 1;
}

const totals = {
  users: sqlite.prepare(`SELECT count(*) AS c FROM user`).get().c,
  seedUsers: sqlite
    .prepare(`SELECT count(*) AS c FROM user WHERE email LIKE ?`)
    .get(`%@${SEED_DOMAIN}`).c,
  seedSessions: sqlite.prepare(`SELECT count(*) AS c FROM session WHERE id LIKE 'seed-sess-%'`).get()
    .c,
  seedFavorites: sqlite
    .prepare(`SELECT count(*) AS c FROM favorite WHERE record_id LIKE 'seed-demo-%'`)
    .get().c,
  seedActivity: sqlite.prepare(`SELECT count(*) AS c FROM activity WHERE id LIKE 'seed-act-%'`).get()
    .c,
};

sqlite.close();

console.log(
  JSON.stringify(
    {
      ok: true,
      dbPath,
      reset,
      createdSeedUsers,
      seedUserEmails: SEED_USERS.map((u) => u.email),
      enrichedExistingUsers: enrichedExisting,
      totals,
      note: "Seed users are for admin viewing only (no login password). Refresh /fr/dashboard/admin.",
    },
    null,
    2,
  ),
);
