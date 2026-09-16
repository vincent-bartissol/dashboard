import { describe, expect, it } from "vitest";
import { recordsToMarkers } from "./markers";

describe("recordsToMarkers", () => {
  it("coerces string lat/lon like extractGeo", () => {
    const markers = recordsToMarkers(
      [{ id: "1", name: "Place", geo: { lat: "48.85", lon: "2.35" } }],
      { idField: "id", titleField: "name", geoField: "geo" },
    );
    expect(markers).toEqual([
      {
        id: "1::0",
        position: { lat: 48.85, lon: 2.35 },
        label: "Place",
        color: undefined,
        description: undefined,
      },
    ]);
  });

  it("uses an empty label when the title is missing", () => {
    const markers = recordsToMarkers(
      [{ id: "1", geo: { lat: "48.85", lon: "2.35" } }],
      { idField: "id", titleField: "name", geoField: "geo" },
    );
    expect(markers[0]?.label).toBe("");
  });

  it("skips invalid coordinates", () => {
    expect(
      recordsToMarkers([{ id: "1", name: "X", geo: { lat: "n", lon: "2" } }], {
        idField: "id",
        titleField: "name",
        geoField: "geo",
      }),
    ).toEqual([]);
  });
});
