import { afterEach, describe, expect, it } from "vitest";
import {
  banUserBlockReason,
  clampBanReason,
  demoteAdminBlockReason,
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

  it("allows admin when ban has expired", () => {
    expect(
      isAdminUser({
        id: "u1",
        role: "admin",
        banned: true,
        banExpires: Date.now() - 1000,
      }),
    ).toBe(true);
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

describe("banUserBlockReason", () => {
  it("blocks self-ban and peer admins", () => {
    expect(
      banUserBlockReason({ targetUserId: "a", actorUserId: "a", targetIsAdmin: false }),
    ).toBe("selfBan");
    expect(
      banUserBlockReason({ targetUserId: "b", actorUserId: "a", targetIsAdmin: true }),
    ).toBe("peerAdmin");
    expect(
      banUserBlockReason({ targetUserId: "b", actorUserId: "a", targetIsAdmin: false }),
    ).toBeNull();
  });
});

describe("demoteAdminBlockReason", () => {
  it("distinguishes self-demote from last admin", () => {
    expect(
      demoteAdminBlockReason({
        targetUserId: "a",
        targetIsAdmin: true,
        actorUserId: "a",
        adminCount: 2,
      }),
    ).toBe("selfDemote");
    expect(
      demoteAdminBlockReason({
        targetUserId: "b",
        targetIsAdmin: true,
        actorUserId: "a",
        adminCount: 1,
      }),
    ).toBe("lastAdmin");
    expect(
      demoteAdminBlockReason({
        targetUserId: "b",
        targetIsAdmin: true,
        actorUserId: "a",
        adminCount: 2,
      }),
    ).toBeNull();
  });
});

describe("clampBanReason", () => {
  it("trims and caps length", () => {
    expect(clampBanReason("  spam  ")).toBe("spam");
    expect(clampBanReason(undefined)).toBe("Banned by admin");
    expect(clampBanReason("x".repeat(250))).toHaveLength(200);
  });
});
