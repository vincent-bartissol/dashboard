import { describe, expect, it } from "vitest";
import {
  arrondissementWhere,
  formatDistrictOrdinal,
  parsePreferredDistrict,
} from "./arrondissement";
import { DATASETS } from "./datasets";

describe("formatDistrictOrdinal", () => {
  it("localises ordinals", () => {
    expect(formatDistrictOrdinal("01", "fr")).toBe("1er");
    expect(formatDistrictOrdinal("02", "fr")).toBe("2e");
    expect(formatDistrictOrdinal("01", "en")).toBe("1st");
    expect(formatDistrictOrdinal("02", "en")).toBe("2nd");
    expect(formatDistrictOrdinal("03", "en")).toBe("3rd");
    expect(formatDistrictOrdinal("11", "en")).toBe("11th");
    expect(formatDistrictOrdinal("01", "es")).toBe("1.º");
  });
});

describe("arrondissementWhere", () => {
  it("uses dataset-specific Paris encodings", () => {
    expect(arrondissementWhere(DATASETS.trees, "11")).toBe(
      "arrondissement = 'PARIS 11E ARRDT'",
    );
    expect(arrondissementWhere(DATASETS.parks, "01")).toBe("adresse_codepostal = '75001'");
    expect(arrondissementWhere(DATASETS.toilets, "18")).toBe("arrondissement = '75018'");
    expect(arrondissementWhere(DATASETS.street, "20")).toBe("arrondissement = 20");
  });

  it("filters Vélib’ by station-code prefix, not the whole of Paris", () => {
    expect(arrondissementWhere(DATASETS.velib, "01")).toBe(
      "length(stationcode) = 4 AND stationcode like '1*'",
    );
    expect(arrondissementWhere(DATASETS.velib, "11")).toBe("stationcode like '11*'");
    expect(arrondissementWhere(DATASETS.velib, "montreuil")).toBe(
      "nom_arrondissement_communes = 'Montreuil'",
    );
  });

  it("returns nothing without a district or encoding", () => {
    expect(arrondissementWhere(DATASETS.air, "11")).toBeUndefined();
    expect(arrondissementWhere(DATASETS.trees)).toBeUndefined();
    expect(arrondissementWhere(DATASETS.trees, "99")).toBeUndefined();
  });
});

describe("parsePreferredDistrict", () => {
  it("accepts empty, Montreuil, and arrondissement codes", () => {
    expect(parsePreferredDistrict(null)).toEqual({ ok: true, value: null });
    expect(parsePreferredDistrict("")).toEqual({ ok: true, value: null });
    expect(parsePreferredDistrict("montreuil")).toEqual({ ok: true, value: "montreuil" });
    expect(parsePreferredDistrict("11")).toEqual({ ok: true, value: "11" });
  });

  it("rejects unknown districts", () => {
    expect(parsePreferredDistrict("99")).toEqual({ ok: false });
    expect(parsePreferredDistrict("paris")).toEqual({ ok: false });
  });
});
