import { describe, expect, it } from "vitest";
import { recordId } from "./client";

describe("recordId", () => {
  it("joins composite scalar fields", () => {
    expect(
      recordId(
        { arrondissement: "75018", adresse: "38 rue charles hermite" },
        "arrondissement,adresse",
      ),
    ).toBe("75018::38 rue charles hermite");
  });

  it("keeps a single scalar id", () => {
    expect(recordId({ stationcode: "11030" }, "stationcode")).toBe("11030");
  });
});
