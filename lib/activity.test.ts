import { beforeEach, describe, expect, it, vi } from "vitest";

const selectMock = vi.fn();
const insertMock = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => selectMock(...args),
    insert: (...args: unknown[]) => insertMock(...args),
  },
}));

import {
  normalizeActivityPath,
  recordPageView,
  shouldSkipPageViewDedupe,
} from "./activity";

function chainSelect(rows: unknown[]) {
  const builder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  };
  selectMock.mockReturnValue(builder);
  return builder;
}

function chainInsert() {
  const builder = {
    values: vi.fn().mockResolvedValue(undefined),
  };
  insertMock.mockReturnValue(builder);
  return builder;
}

describe("normalizeActivityPath", () => {
  it("accepts allowlisted dashboard paths", () => {
    expect(normalizeActivityPath("/fr/dashboard")).toBe("/dashboard");
    expect(normalizeActivityPath("/en/dashboard/velib")).toBe("/dashboard/velib");
    expect(normalizeActivityPath("/dashboard/favorites")).toBe("/dashboard/favorites");
  });

  it("rejects admin and unknown paths", () => {
    expect(normalizeActivityPath("/fr/dashboard/admin")).toBeNull();
    expect(normalizeActivityPath("/fr/dashboard/admin/users/1")).toBeNull();
    expect(normalizeActivityPath("/fr/dashboard/unknown")).toBeNull();
    expect(normalizeActivityPath("/fr/login")).toBeNull();
  });
});

describe("shouldSkipPageViewDedupe", () => {
  it("skips when within the window", () => {
    const now = 10_000;
    expect(shouldSkipPageViewDedupe(now - 60_000, now, 120_000)).toBe(true);
    expect(shouldSkipPageViewDedupe(now - 180_000, now, 120_000)).toBe(false);
  });

  it("does not skip when missing", () => {
    expect(shouldSkipPageViewDedupe(null)).toBe(false);
    expect(shouldSkipPageViewDedupe(undefined)).toBe(false);
  });
});

describe("recordPageView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects paths outside the allowlist", async () => {
    expect(await recordPageView("user-1", "/fr/login")).toBe(false);
    expect(selectMock).not.toHaveBeenCalled();
  });

  it("dedupes the same path inside the window", async () => {
    chainSelect([
      {
        createdAt: new Date(),
        metadata: JSON.stringify({ path: "/dashboard/velib" }),
      },
    ]);
    expect(await recordPageView("user-1", "/fr/dashboard/velib")).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("records when no recent duplicate exists", async () => {
    chainSelect([]);
    chainInsert();
    expect(await recordPageView("user-1", "/fr/dashboard/velib")).toBe(true);
    expect(insertMock).toHaveBeenCalled();
  });
});
