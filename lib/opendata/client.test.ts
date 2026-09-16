import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllRecords, fetchCount, formatCount } from "./client";

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

describe("fetchAllRecords", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps first-page rows when a later page fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const firstPage = {
      total_count: 150,
      results: Array.from({ length: 100 }, (_, index) => ({ id: index })),
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstPage,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
        }),
    );
    const result = await fetchAllRecords("les-arbres", 60, { max: 150 });
    expect(result.ok).toBe(false);
    expect(result.page.results).toHaveLength(100);
    expect(result.page.total_count).toBe(150);
  });
});
