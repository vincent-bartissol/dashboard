import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCount, formatCount } from "./client";

describe("fetchCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns ok false when Open Data fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );
    await expect(fetchCount("les-arbres", 60)).resolves.toEqual({
      ok: false,
      count: 0,
      error: "Open Data les-arbres: 503",
    });
  });

  it("returns total_count when the request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total_count: 42, results: [] }),
      }),
    );
    await expect(fetchCount("les-arbres", 60)).resolves.toEqual({
      ok: true,
      count: 42,
    });
  });
});

describe("formatCount", () => {
  it("formats a successful count and dashes a failure", () => {
    expect(formatCount({ ok: true, count: 12 }, (value) => String(value))).toBe("12");
    expect(formatCount({ ok: false, count: 0, error: "down" }, (value) => String(value))).toBe(
      "—",
    );
  });
});
