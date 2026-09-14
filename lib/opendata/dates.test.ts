import { describe, expect, it } from "vitest";
import { isoDateDaysAgo } from "./dates";

describe("isoDateDaysAgo", () => {
  it("returns a UTC calendar date", () => {
    expect(isoDateDaysAgo(7, Date.UTC(2026, 8, 14, 10, 0, 0))).toBe("2026-09-07");
  });
});
