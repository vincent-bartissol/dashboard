import { describe, expect, it } from "vitest";
import {
  normalizeActivityPath,
  shouldSkipPageViewDedupe,
} from "./activity";

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
