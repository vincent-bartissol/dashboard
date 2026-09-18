"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { ADMIN_ROLE, USER_ROLE, canBanUser, canDemoteAdmin } from "@/lib/admin";
import { recordActivity } from "@/lib/activity";
import { countAdmins, getUserForAdmin } from "@/lib/db/queries";
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
  if (!canBanUser({ targetUserId: input.userId, actorUserId: session.user.id })) {
    return { ok: false, error: "selfBan" };
  }
  const target = await getUserForAdmin(input.userId);
  if (!target) return { ok: false, error: "notFound" };

  try {
    await auth.api.banUser({
      body: {
        userId: input.userId,
        banReason: input.banReason?.trim() || "Banned by admin",
      },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.ban", {
      targetUserId: input.userId,
      banReason: input.banReason?.trim() || "Banned by admin",
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
    if (
      !canDemoteAdmin({
        targetUserId: input.userId,
        targetRole: target.role,
        actorUserId: session.user.id,
        adminCount,
      })
    ) {
      return { ok: false, error: "lastAdmin" };
    }
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
  sessionToken: string;
}): Promise<AdminActionResult> {
  const session = await requireAdmin();
  if (!input.sessionToken.trim()) return { ok: false, error: "session" };

  try {
    await auth.api.revokeUserSession({
      body: { sessionToken: input.sessionToken },
      headers: await headers(),
    });
    await recordActivity(session.user.id, "admin.revokeSession", {
      targetUserId: input.userId,
    });
    await revalidateAdmin(input.userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "session" };
  }
}
