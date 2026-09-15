import { describe, expect, it } from "vitest";
import { firstSearchParam, safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps an internal dashboard path and prefixes the locale", () => {
    expect(safeNext("/dashboard/montreuil")).toBe("/fr/dashboard/montreuil");
    expect(safeNext("/en/dashboard/montreuil")).toBe("/en/dashboard/montreuil");
  });

  it("falls back when missing or empty", () => {
    expect(safeNext()).toBe("/fr/dashboard");
    expect(safeNext("")).toBe("/fr/dashboard");
    expect(safeNext(null)).toBe("/fr/dashboard");
    expect(safeNext(null, "es")).toBe("/es/dashboard");
  });

  it("rejects off-site destinations", () => {
    expect(safeNext("https://evil.com")).toBe("/fr/dashboard");
    expect(safeNext("//evil.com")).toBe("/fr/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/fr/dashboard");
    expect(safeNext("/\\\\evil.com")).toBe("/fr/dashboard");
    expect(safeNext("http://local.invalid//evil.com")).toBe("/fr/dashboard");
    expect(safeNext("//local.invalid//evil.com")).toBe("/fr/dashboard");
  });

  it("rejects auth pages with or without a locale prefix", () => {
    expect(safeNext("/login")).toBe("/fr/dashboard");
    expect(safeNext("/en/login")).toBe("/en/dashboard");
    expect(safeNext("/signup")).toBe("/fr/dashboard");
    expect(safeNext("/login/foo")).toBe("/fr/dashboard");
    expect(safeNext("/es/forgot-password")).toBe("/es/dashboard");
    expect(safeNext("/reset-password")).toBe("/fr/dashboard");
    expect(safeNext("/reset-password?token=abc")).toBe("/fr/dashboard");
  });

  it("uses the first value of a duplicate query", () => {
    expect(safeNext(["/dashboard/montreuil", "https://evil.com"])).toBe(
      "/fr/dashboard/montreuil",
    );
  });
});

describe("firstSearchParam", () => {
  it("returns the first array entry", () => {
    expect(firstSearchParam(["/a", "/b"])).toBe("/a");
  });
});
