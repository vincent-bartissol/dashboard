import { afterEach, describe, expect, it, vi } from "vitest";
import { DATASETS } from "./datasets";
import { loadThemeMarkers, loadThemePage, markerSelect, THEME_PAGE_SIZE } from "./theme-api";

vi.mock("@/lib/db/queries", () => ({
  getProfile: vi.fn(async () => ({ arrondissement: null })),
}));

describe("markerSelect", () => {
  it("includes id, title, and geo fields", () => {
    const select = markerSelect(DATASETS.markets);
    expect(select.split(",")).toEqual(
      expect.arrayContaining(["id_marche", "nom_long", "geo_point_2d"]),
    );
  });

  it("adds Vélib’ availability fields", () => {
    const select = markerSelect(DATASETS.velib);
    expect(select).toContain("numbikesavailable");
    expect(select).toContain("numdocksavailable");
    expect(select).toContain("ebike");
  });

  it("adds event and market description fields", () => {
    expect(markerSelect(DATASETS.events)).toContain("lead_text");
    expect(markerSelect(DATASETS.events)).toContain("address_name");
    expect(markerSelect(DATASETS.markets)).toContain("jours_tenue");
  });
});

describe("loadThemePage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns hasMore when more rows remain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 120,
          results: Array.from({ length: THEME_PAGE_SIZE }, (_, i) => ({ id: i })),
        }),
      }),
    );
    const result = await loadThemePage(DATASETS.markets, "user-1", { offset: 0 });
    expect(result.ok).toBe(true);
    expect(result.hasMore).toBe(true);
    expect(result.nextOffset).toBe(THEME_PAGE_SIZE);
    expect(result.page.results).toHaveLength(THEME_PAGE_SIZE);
  });

  it("returns hasMore false on the last page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_count: 55,
          results: Array.from({ length: 5 }, (_, i) => ({ id: i })),
        }),
      }),
    );
    const result = await loadThemePage(DATASETS.markets, "user-1", {
      offset: 50,
      limit: 50,
    });
    expect(result.hasMore).toBe(false);
    expect(result.nextOffset).toBe(55);
  });
});

describe("loadThemeMarkers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requests a slim select for map markers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_count: 2, results: [{ id_marche: "1" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await loadThemeMarkers(DATASETS.markets, "user-1");
    expect(result.ok).toBe(true);
    expect(result.page.results).toHaveLength(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("select=");
    expect(url).toContain("geo_point_2d");
  });

  it("returns empty page when dataset has no geo field", async () => {
    const result = await loadThemeMarkers(DATASETS.air, "user-1");
    expect(result).toEqual({ ok: true, page: { total_count: 0, results: [] } });
  });
});
