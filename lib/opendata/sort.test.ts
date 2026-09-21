import { describe, expect, it } from "vitest";
import { compareCellValues, sortByKey } from "./sort";

describe("compareCellValues", () => {
  it("puts empty values last in either direction", () => {
    expect(compareCellValues(null, "a", "asc")).toBeGreaterThan(0);
    expect(compareCellValues("", "a", "desc")).toBeGreaterThan(0);
    expect(compareCellValues(null, null)).toBe(0);
  });

  it("compares numbers numerically", () => {
    expect(compareCellValues(2, 10, "asc")).toBeLessThan(0);
    expect(compareCellValues("2", "10", "asc")).toBeLessThan(0);
    expect(compareCellValues(2, 10, "desc")).toBeGreaterThan(0);
  });

  it("compares text with numeric awareness", () => {
    expect(compareCellValues("Station 2", "Station 10", "asc")).toBeLessThan(0);
    expect(compareCellValues("Nation", "Bastille", "asc")).toBeGreaterThan(0);
  });
});

describe("sortByKey", () => {
  it("returns the original order when key is null", () => {
    const rows = [{ name: "b" }, { name: "a" }];
    expect(sortByKey(rows, null, "asc")).toBe(rows);
  });

  it("sorts by the given key", () => {
    const rows = [
      { name: "Charlie", bikes: 3 },
      { name: "Alice", bikes: 10 },
      { name: "Bob", bikes: 1 },
    ];
    expect(sortByKey(rows, "name", "asc").map((r) => r.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
    expect(sortByKey(rows, "bikes", "desc").map((r) => r.bikes)).toEqual([10, 3, 1]);
  });
});
