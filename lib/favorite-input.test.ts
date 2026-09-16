import { describe, expect, it } from "vitest";
import { DATASETS } from "./opendata/datasets";
import { parseFavoriteInput } from "./favorite-input";

describe("parseFavoriteInput", () => {
  it("accepts a known dataset", () => {
    expect(
      parseFavoriteInput({
        datasetId: DATASETS.velib.id,
        recordId: "123",
        label: "Station",
        geo: null,
      }),
    ).toEqual({
      ok: true,
      datasetId: DATASETS.velib.id,
      recordId: "123",
      label: "Station",
      geo: null,
    });
  });

  it("rejects an unknown datasetId", () => {
    expect(
      parseFavoriteInput({
        datasetId: "not-a-dataset",
        recordId: "123",
        label: "Station",
      }),
    ).toEqual({ ok: false });
  });

  it("rejects an empty recordId", () => {
    expect(
      parseFavoriteInput({
        datasetId: DATASETS.velib.id,
        recordId: "  ",
        label: "Station",
      }),
    ).toEqual({ ok: false });
  });
});
