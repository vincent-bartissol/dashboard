import { describe, expect, it } from "vitest";
import { PARIS_BBOX } from "./datasets";
import { clampBbox, recordsQueryFromSearch } from "./bbox";

describe("clampBbox", () => {
  it("intersects with the allowed envelope", () => {
    expect(
      clampBbox(
        { south: 48.8, west: 2.2, north: 48.86, east: 2.35 },
        PARIS_BBOX,
      ),
    ).toEqual({
      south: 48.815,
      west: 2.225,
      north: 48.86,
      east: 2.35,
    });
  });

  it("rejects inverted or empty boxes", () => {
    expect(
      clampBbox({ south: 48.9, west: 2.3, north: 48.8, east: 2.4 }, PARIS_BBOX),
    ).toBeNull();
    expect(
      clampBbox({ south: 49.1, west: 2.3, north: 49.2, east: 2.4 }, PARIS_BBOX),
    ).toBeNull();
  });
});

describe("recordsQueryFromSearch", () => {
  it("clamps bbox and ignores a client where clause", () => {
    const params = new URLSearchParams({
      dataset: "les-arbres",
      south: "48.8",
      west: "2.2",
      north: "48.86",
      east: "2.35",
      where: "1=1 OR arrondissement = 'PARIS 20E ARRDT'",
    });
    expect(recordsQueryFromSearch(params, PARIS_BBOX)).toEqual({
      ok: true,
      datasetId: "les-arbres",
      bbox: {
        south: 48.815,
        west: 2.225,
        north: 48.86,
        east: 2.35,
      },
    });
  });

  it("returns invalid_bbox for missing coordinates", () => {
    expect(recordsQueryFromSearch(new URLSearchParams({ dataset: "les-arbres" }), PARIS_BBOX)).toEqual(
      { ok: false, error: "invalid_bbox" },
    );
  });
});
