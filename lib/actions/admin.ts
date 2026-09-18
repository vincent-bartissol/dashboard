"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  ADMIN_ROLE,
  USER_ROLE,
  banUserBlockReason,
  clampBanReason,
  demoteAdminBlockReason,
  isAdminUser,
} from "@/lib/admin";
import { recordActivity } from "@/lib/activity";
import {
  countAdmins,
  getOwnedSessionToken,
  getUserForAdmin,
} from "@/lib/db/queries";
import { routing } from "@/i18n/routing";
import { requireAdmin } from "@/lib/session";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

async function revalidateAdmin(userId: string) {
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dashboard/admin`);
    revalidatePath(`/${locale}/dashboard/admin/users/${userId}`);
  }
}

export async function banUserAction(input: {
  userId: string;
  banReason?: string;
}): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const target = await getUserForAdmin(input.userId);
  if (!target) return { ok: false, error: "notFound" };

  const block = banUserBlockReason({
    targetUserId: input.userId,
    actorUserId: session.user.id,
    targetIsAdmin: isAdminUser(target),
  });
  if (block) return { ok: false, error: block };

  const banReason = clampBanReason(input.banReason);

  try {
    await auth.api.banUser({
      body: {
        userId: input.userId,
        banReason,
      },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.ban", {
      targetUserId: input.userId,
      banReason,
    });
    await revalidateAdmin(input.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "ban" };
  }
}

export async function unbanUserAction(input: {
  userId: string;
}): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const target = await getUserForAdmin(input.userId);
  if (!target) return { ok: false, error: "notFound" };

  try {
    await auth.api.unbanUser({
      body: { userId: input.userId },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.unban", {
      targetUserId: input.userId,
    });
    await revalidateAdmin(input.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "unban" };
  }
}

export async function setUserRoleAction(input: {
  userId: string;
  role: "user" | "admin";
}): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const target = await getUserForAdmin(input.userId);
  if (!target) return { ok: false, error: "notFound" };

  if (input.role !== ADMIN_ROLE && input.role !== USER_ROLE) {
    return { ok: false, error: "role" };
  }

  if (input.role === USER_ROLE) {
    const adminCount = await countAdmins();
    const block = demoteAdminBlockReason({
      targetUserId: input.userId,
      targetIsAdmin: isAdminUser(target),
      actorUserId: session.user.id,
      adminCount,
    });
    if (block) return { ok: false, error: block };
  }

  try {
    await auth.api.setRole({
      body: { userId: input.userId, role: input.role },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.setRole", {
      targetUserId: input.userId,
      previousRole: target.role,
      role: input.role,
    });
    await revalidateAdmin(input.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "role" };
  }
}

export async function revokeSessionAction(input: {
  userId: string;
  sessionId: string;
}): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!input.sessionId.trim()) return { ok: false, error: "session" };

  const owned = await getOwnedSessionToken(input.sessionId, input.userId);
  if (!owned) return { ok: false, error: "session" };

  try {
    await auth.api.revokeUserSession({
      body: { sessionToken: owned.token },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.revokeSession", {
      targetUserId: input.userId,
      sessionId: input.sessionId,
    });
    await revalidateAdmin(input.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "session" };
  }
}
