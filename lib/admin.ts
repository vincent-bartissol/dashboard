export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
export const ADMIN_ROLES = [ADMIN_ROLE] as const;
export const BAN_REASON_MAX = 200;

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
  banExpires?: Date | string | number | null;
}): boolean {
  if (isBannedUser(user)) return false;
  if (user.role === ADMIN_ROLE) return true;
  return parseAdminUserIds().includes(user.id);
}

export function isBannedUser(user: {
  banned?: boolean | null;
  banExpires?: Date | string | number | null;
}): boolean {
  if (!user.banned) return false;
  if (user.banExpires == null) return true;
  const expires = toTimestamp(user.banExpires);
  if (expires == null) return true;
  return expires > Date.now();
}

export function toTimestamp(value: Date | string | number): number | null {
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isNaN(ms) ? null : ms;
  }
  if (typeof value === "number") {
    // Drizzle sqlite timestamp mode stores seconds; Date.now() is ms.
    const ms = value < 1e12 ? value * 1000 : value;
    return Number.isNaN(ms) ? null : ms;
  }
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export type DemoteBlockReason = "selfDemote" | "lastAdmin";

export function demoteAdminBlockReason(params: {
  targetUserId: string;
  targetIsAdmin: boolean;
  actorUserId: string;
  adminCount: number;
}): DemoteBlockReason | null {
  if (!params.targetIsAdmin) return null;
  if (params.targetUserId === params.actorUserId) return "selfDemote";
  if (params.adminCount <= 1) return "lastAdmin";
  return null;
}

/** @deprecated Prefer demoteAdminBlockReason for distinct errors. */
export function canDemoteAdmin(params: {
  targetUserId: string;
  targetRole: string | null | undefined;
  actorUserId: string;
  adminCount: number;
}): boolean {
  return (
    demoteAdminBlockReason({
      targetUserId: params.targetUserId,
      targetIsAdmin: params.targetRole === ADMIN_ROLE || parseAdminUserIds().includes(params.targetUserId),
      actorUserId: params.actorUserId,
      adminCount: params.adminCount,
    }) == null
  );
}

export type BanBlockReason = "selfBan" | "peerAdmin";

export function banUserBlockReason(params: {
  targetUserId: string;
  actorUserId: string;
  targetIsAdmin: boolean;
}): BanBlockReason | null {
  if (params.targetUserId === params.actorUserId) return "selfBan";
  if (params.targetIsAdmin) return "peerAdmin";
  return null;
}

export function canBanUser(params: {
  targetUserId: string;
  actorUserId: string;
  targetIsAdmin?: boolean;
}): boolean {
  return (
    banUserBlockReason({
      targetUserId: params.targetUserId,
      actorUserId: params.actorUserId,
      targetIsAdmin: params.targetIsAdmin ?? false,
    }) == null
  );
}

export function clampBanReason(raw: string | undefined, fallback = "Banned by admin"): string {
  const trimmed = raw?.trim() || fallback;
  return trimmed.slice(0, BAN_REASON_MAX);
}
