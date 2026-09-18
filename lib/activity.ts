import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { activity } from "@/lib/db/schema";
import { NAV_ITEMS } from "@/lib/opendata/datasets";
import { stripLocalePrefix } from "@/i18n/path";

export const PAGE_VIEW_DEDUPE_MS = 2 * 60 * 1000;

export const ACTIVITY_ACTIONS = [
  "signup",
  "login",
  "favorite.add",
  "favorite.remove",
  "profile.update",
  "page.view",
  "admin.ban",
  "admin.unban",
  "admin.setRole",
  "admin.revokeSession",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

const ALLOWED_PAGE_PATHS = new Set<string>(NAV_ITEMS.map((item) => item.href));

export function normalizeActivityPath(pathname: string): string | null {
  const path = stripLocalePrefix(pathname);
  if (!path.startsWith("/dashboard")) return null;
  if (path === "/dashboard/admin" || path.startsWith("/dashboard/admin/")) return null;
  if (!ALLOWED_PAGE_PATHS.has(path)) return null;
  return path;
}

export function shouldSkipPageViewDedupe(
  lastCreatedAt: Date | number | null | undefined,
  now = Date.now(),
  windowMs = PAGE_VIEW_DEDUPE_MS,
): boolean {
  if (lastCreatedAt == null) return false;
  const ts = lastCreatedAt instanceof Date ? lastCreatedAt.getTime() : Number(lastCreatedAt);
  if (Number.isNaN(ts)) return false;
  return now - ts < windowMs;
}

export async function recordActivity(
  userId: string,
  action: ActivityAction,
  metadata?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await db.insert(activity).values({
      id: crypto.randomUUID(),
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    });
  } catch {
    // Never break signup, login, favorites, or profile updates.
  }
}

export async function recordPageView(userId: string, pathname: string): Promise<boolean> {
  const path = normalizeActivityPath(pathname);
  if (!path) return false;

  try {
    const since = new Date(Date.now() - PAGE_VIEW_DEDUPE_MS);
    const recent = await db
      .select({ createdAt: activity.createdAt, metadata: activity.metadata })
      .from(activity)
      .where(
        and(
          eq(activity.userId, userId),
          eq(activity.action, "page.view"),
          gte(activity.createdAt, since),
        ),
      )
      .orderBy(desc(activity.createdAt))
      .limit(20);

    const duplicate = recent.some((row) => {
      if (!shouldSkipPageViewDedupe(row.createdAt)) return false;
      if (!row.metadata) return false;
      try {
        const parsed = JSON.parse(row.metadata) as { path?: string };
        return parsed.path === path;
      } catch {
        return false;
      }
    });
    if (duplicate) return false;

    await recordActivity(userId, "page.view", { path });
    return true;
  } catch {
    return false;
  }
}
