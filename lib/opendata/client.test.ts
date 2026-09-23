import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllRecords, fetchCount, FETCH_TIMEOUT_MS, formatCount } from "./client";

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

  it("returns ok false when total_count is not finite", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ total_count: "nope", results: [] }),
      }),
    );
    await expect(fetchCount("les-arbres", 60)).resolves.toEqual({
      ok: false,
      count: 0,
      error: "Open Data les-arbres: invalid payload",
    });
  });

  it("passes a timeout abort signal to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_count: 1, results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await fetchCount("les-arbres", 60);
    const init = fetchMock.mock.calls[0]?.[1] as { signal?: AbortSignal };
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(FETCH_TIMEOUT_MS).toBe(10_000);
  });

  it("returns ok false when the payload is not a page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ error_code: "ODSQLSyntaxError" }),
      }),
    );
    await expect(fetchCount("marches-decouverts", 60)).resolves.toEqual({
      ok: false,
      count: 0,
      error: "Open Data marches-decouverts: invalid payload",
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

  it("forwards select on every page request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_count: 2, results: [{ id: 1 }, { id: 2 }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await fetchAllRecords("marches-decouverts", 60, {
      max: 100,
      select: "id_marche,geo_point_2d",
    });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("select=id_marche%2Cgeo_point_2d");
  });
});
