import { describe, expect, it } from "vitest";
import {
  clampLimitParam,
  clampOffsetParam,
  clampPageLimit,
  clampPageOffset,
  MAX_OFFSET,
} from "./page-clamp";

describe("clampPageLimit", () => {
  const defaults = { size: 50, max: 100 };

  it("defaults when missing or non-finite", () => {
    expect(clampPageLimit(undefined, defaults)).toBe(50);
    expect(clampPageLimit(Number.NaN, defaults)).toBe(50);
  });

  it("clamps to [1, max]", () => {
    expect(clampPageLimit(0, defaults)).toBe(1);
    expect(clampPageLimit(-3, defaults)).toBe(1);
    expect(clampPageLimit(75.9, defaults)).toBe(75);
    expect(clampPageLimit(999, defaults)).toBe(100);
  });
});

describe("clampPageOffset", () => {
  it("defaults negative and non-finite to 0", () => {
    expect(clampPageOffset(undefined)).toBe(0);
    expect(clampPageOffset(-1)).toBe(0);
    expect(clampPageOffset(Number.NaN)).toBe(0);
  });

  it("caps at MAX_OFFSET", () => {
    expect(clampPageOffset(MAX_OFFSET)).toBe(MAX_OFFSET);
    expect(clampPageOffset(MAX_OFFSET + 1)).toBe(MAX_OFFSET);
    expect(clampPageOffset(99_999_999)).toBe(MAX_OFFSET);
  });

  it("floors fractional offsets", () => {
    expect(clampPageOffset(12.7)).toBe(12);
  });
});

describe("query-string helpers", () => {
  it("parse limit and offset params", () => {
    expect(clampLimitParam(null, { size: 50, max: 100 })).toBe(50);
    expect(clampLimitParam("80", { size: 50, max: 100 })).toBe(80);
    expect(clampOffsetParam(null)).toBe(0);
    expect(clampOffsetParam("99999999")).toBe(MAX_OFFSET);
  });
});
