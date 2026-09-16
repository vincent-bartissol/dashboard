import { describe, expect, it } from "vitest";
import { DATASETS } from "./datasets";
import { themeOrderBy } from "./order-by";

describe("themeOrderBy", () => {
  it("uses a single non-geo id field", () => {
    expect(themeOrderBy(DATASETS.velib)).toBe("stationcode");
    expect(themeOrderBy(DATASETS.events)).toBe("id");
  });

  it("falls back to titleField for composite ids", () => {
    expect(themeOrderBy(DATASETS.toilets)).toBe("adresse");
    expect(themeOrderBy(DATASETS.montreuilTrees)).toBe("nom_vernaculaire");
  });
});
