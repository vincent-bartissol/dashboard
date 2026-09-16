import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to max hits then rejects", () => {
    const now = 1_000;
    const limiter = createRateLimiter({
      max: 3,
      windowMs: 60_000,
      now: () => now,
    });
    expect(limiter.check("user-1").ok).toBe(true);
    expect(limiter.check("user-1").ok).toBe(true);
    expect(limiter.check("user-1").ok).toBe(true);
    expect(limiter.check("user-1")).toEqual({ ok: false, retryAfterSec: 60 });
    expect(limiter.check("user-2").ok).toBe(true);
  });

  it("resets after the window", () => {
    let now = 1_000;
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 1_000,
      now: () => now,
    });
    expect(limiter.check("a").ok).toBe(true);
    expect(limiter.check("a").ok).toBe(false);
    now = 2_001;
    expect(limiter.check("a").ok).toBe(true);
  });
});
