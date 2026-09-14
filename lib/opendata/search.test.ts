import { describe, expect, it } from "vitest";
import { recordMatchesQuery } from "./search";

const columns = [
  { key: "name", label: "Station" },
  { key: "numbikesavailable", label: "Vélos" },
];

describe("recordMatchesQuery", () => {
  it("matches configured columns only", () => {
    const record = { name: "Oberkampf", secret: "hidden", numbikesavailable: 4 };
    expect(recordMatchesQuery(record, columns, "oberk")).toBe(true);
    expect(recordMatchesQuery(record, columns, "hidden")).toBe(false);
    expect(recordMatchesQuery(record, columns, "4")).toBe(true);
  });
});
