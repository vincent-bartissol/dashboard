export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
export const ADMIN_ROLES = [ADMIN_ROLE] as const;

export function parseAdminUserIds(raw = process.env.ADMIN_USER_IDS): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function isAdminUser(user: {
  id: string;
  role?: string | null;
  banned?: boolean | null;
}): boolean {
  if (user.banned) return false;
  if (user.role === ADMIN_ROLE) return true;
  return parseAdminUserIds().includes(user.id);
}

export function isBannedUser(user: {
  banned?: boolean | null;
  banExpires?: Date | string | number | null;
}): boolean {
  if (!user.banned) return false;
  if (user.banExpires == null) return true;
  const expires =
    user.banExpires instanceof Date
      ? user.banExpires.getTime()
      : typeof user.banExpires === "number"
        ? user.banExpires
        : new Date(user.banExpires).getTime();
  if (Number.isNaN(expires)) return true;
  return expires > Date.now();
}

export function canDemoteAdmin(params: {
  targetUserId: string;
  targetRole: string | null | undefined;
  actorUserId: string;
  adminCount: number;
}): boolean {
  if (params.targetRole !== ADMIN_ROLE) return true;
  if (params.targetUserId === params.actorUserId) return false;
  return params.adminCount > 1;
}

export function canBanUser(params: { targetUserId: string; actorUserId: string }): boolean {
  return params.targetUserId !== params.actorUserId;
}
