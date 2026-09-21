import { and, count, desc, eq, gt, isNull, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { activity, favorite, profile, session, user } from "@/lib/db/schema";
import { isAdminUser, isBannedUser } from "@/lib/admin";

export async function listFavorites(userId: string, datasetId?: string) {
  if (datasetId) {
    return db
      .select()
      .from(favorite)
      .where(and(eq(favorite.userId, userId), eq(favorite.datasetId, datasetId)));
  }
  return db.select().from(favorite).where(eq(favorite.userId, userId));
}

export async function getProfile(userId: string) {
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows[0] ?? { userId, firstName: null, lastName: null, arrondissement: null };
}

export async function listUsersForAdmin(search?: string) {
  const q = search?.trim();
  if (q) {
    const pattern = `%${q}%`;
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(or(like(user.email, pattern), like(user.name, pattern)))
      .orderBy(desc(user.createdAt));
  }
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export async function getUserForAdmin(userId: string) {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      banExpires: user.banExpires,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Public session fields for admin UI — never includes the bearer token. */
export async function listSessionsForUser(userId: string) {
  return db
    .select({
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .where(eq(session.userId, userId))
    .orderBy(desc(session.createdAt));
}

/** Server-only: resolve a session token for revoke after ownership check. */
export async function getOwnedSessionToken(sessionId: string, userId: string) {
  const rows = await db
    .select({
      id: session.id,
      token: session.token,
      userId: session.userId,
    })
    .from(session)
    .where(and(eq(session.id, sessionId), eq(session.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listActivityForUser(userId: string, limit = 100) {
  return db
    .select()
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.createdAt))
    .limit(limit);
}

/** Counts users who currently pass isAdminUser (role or break-glass, not banned). */
export async function countAdmins() {
  const rows = await db
    .select({
      id: user.id,
      role: user.role,
      banned: user.banned,
      banExpires: user.banExpires,
    })
    .from(user);
  return rows.filter((row) => isAdminUser(row)).length;
}

export async function getAdminStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totals, bannedRows, activeSessions, recentSignups, topFavorites, topPaths] =
    await Promise.all([
      db
        .select({
          users: count(),
          verified: sql<number>`sum(case when ${user.emailVerified} = 1 then 1 else 0 end)`,
        })
        .from(user),
      // Use column helpers so Dates bind correctly (raw sql`${date}` is not bindable by better-sqlite3).
      db
        .select({ value: count() })
        .from(user)
        .where(
          and(eq(user.banned, true), or(isNull(user.banExpires), gt(user.banExpires, now))),
        ),
      db
        .select({ value: count() })
        .from(session)
        .where(gt(session.expiresAt, now)),
      db
        .select({ value: count() })
        .from(user)
        .where(gt(user.createdAt, weekAgo)),
      // Group by place only — label is a snapshot and can differ across users.
      db
        .select({
          datasetId: favorite.datasetId,
          recordId: favorite.recordId,
          label: sql<string>`max(${favorite.label})`,
          value: count(),
        })
        .from(favorite)
        .groupBy(favorite.datasetId, favorite.recordId)
        .orderBy(desc(count()))
        .limit(10),
      db
        .select({
          path: sql<string>`json_extract(${activity.metadata}, '$.path')`,
          value: count(),
        })
        .from(activity)
        .where(eq(activity.action, "page.view"))
        .groupBy(sql`json_extract(${activity.metadata}, '$.path')`)
        .orderBy(desc(count()))
        .limit(10),
    ]);

  return {
    users: totals[0]?.users ?? 0,
    verified: Number(totals[0]?.verified ?? 0),
    banned: bannedRows[0]?.value ?? 0,
    activeSessions: activeSessions[0]?.value ?? 0,
    signupsLast7Days: recentSignups[0]?.value ?? 0,
    topFavorites,
    topPaths: topPaths.filter((row) => row.path),
  };
}

export function adminUserStatus(row: {
  emailVerified: boolean;
  banned: boolean | null;
  banExpires?: Date | string | number | null;
}): "banned" | "active" | "unverified" {
  if (isBannedUser(row)) return "banned";
  if (row.emailVerified) return "active";
  return "unverified";
}

export function adminRoleLabel(row: { id: string; role: string }): "admin" | "adminBreakGlass" | "user" {
  if (row.role === "admin") return "admin";
  if (isAdminUser({ id: row.id, role: row.role })) return "adminBreakGlass";
  return "user";
}
