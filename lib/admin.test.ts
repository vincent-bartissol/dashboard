import { afterEach, describe, expect, it } from "vitest";
import {
  canBanUser,
  canDemoteAdmin,
  isAdminUser,
  isBannedUser,
  parseAdminUserIds,
} from "./admin";

describe("parseAdminUserIds", () => {
  const original = process.env.ADMIN_USER_IDS;
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = original;
  });

  it("splits and trims ids", () => {
    expect(parseAdminUserIds(" a,b , c ")).toEqual(["a", "b", "c"]);
  });

  it("returns empty for blank", () => {
    expect(parseAdminUserIds("")).toEqual([]);
    expect(parseAdminUserIds("   ")).toEqual([]);
    expect(parseAdminUserIds(undefined)).toEqual([]);
  });
});

describe("isAdminUser", () => {
  const original = process.env.ADMIN_USER_IDS;
  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_USER_IDS;
    else process.env.ADMIN_USER_IDS = original;
  });

  it("accepts role admin", () => {
    delete process.env.ADMIN_USER_IDS;
    expect(isAdminUser({ id: "u1", role: "admin" })).toBe(true);
  });

  it("accepts adminUserIds even with role user", () => {
    process.env.ADMIN_USER_IDS = "u1,u2";
    expect(isAdminUser({ id: "u1", role: "user" })).toBe(true);
    expect(isAdminUser({ id: "u3", role: "user" })).toBe(false);
  });

  it("rejects banned users", () => {
    process.env.ADMIN_USER_IDS = "u1";
    expect(isAdminUser({ id: "u1", role: "admin", banned: true })).toBe(false);
  });
});

describe("isBannedUser", () => {
  it("is false when not banned", () => {
    expect(isBannedUser({ banned: false })).toBe(false);
  });

  it("is true for permanent bans", () => {
    expect(isBannedUser({ banned: true, banExpires: null })).toBe(true);
  });

  it("respects ban expiry", () => {
    expect(isBannedUser({ banned: true, banExpires: Date.now() - 1000 })).toBe(false);
    expect(isBannedUser({ banned: true, banExpires: Date.now() + 60_000 })).toBe(true);
  });
});

describe("canBanUser", () => {
  it("blocks self-ban", () => {
    expect(canBanUser({ targetUserId: "a", actorUserId: "a" })).toBe(false);
    expect(canBanUser({ targetUserId: "b", actorUserId: "a" })).toBe(true);
  });
});

describe("canDemoteAdmin", () => {
  it("blocks demoting self or last admin", () => {
    expect(
      canDemoteAdmin({
        targetUserId: "a",
        targetRole: "admin",
        actorUserId: "a",
        adminCount: 2,
      }),
    ).toBe(false);
    expect(
      canDemoteAdmin({
        targetUserId: "b",
        targetRole: "admin",
        actorUserId: "a",
        adminCount: 1,
      }),
    ).toBe(false);
    expect(
      canDemoteAdmin({
        targetUserId: "b",
        targetRole: "admin",
        actorUserId: "a",
        adminCount: 2,
      }),
    ).toBe(true);
  });

  it("allows demoting non-admins", () => {
    expect(
      canDemoteAdmin({
        targetUserId: "b",
        targetRole: "user",
        actorUserId: "a",
        adminCount: 1,
      }),
    ).toBe(true);
  });
});
