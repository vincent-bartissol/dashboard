import { describe, expect, it } from "vitest";
import { recordId, recordLabel } from "./client";

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

describe("recordLabel", () => {
  it("returns the title field", () => {
    expect(recordLabel({ name: "Nation" }, "name", "Sans nom")).toBe("Nation");
  });

  it("uses the locale fallback when the title is empty", () => {
    expect(recordLabel({ name: "" }, "name", "Untitled")).toBe("Untitled");
    expect(recordLabel({}, "name")).toBe("");
  });
});
