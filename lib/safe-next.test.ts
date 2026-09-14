import { describe, expect, it } from "vitest";
import { firstSearchParam, safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps an internal dashboard path", () => {
    expect(safeNext("/dashboard/montreuil")).toBe("/dashboard/montreuil");
  });

  it("falls back when missing or empty", () => {
    expect(safeNext()).toBe("/dashboard");
    expect(safeNext("")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });

  it("rejects off-site destinations", () => {
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext("/\\\\evil.com")).toBe("/dashboard");
    expect(safeNext("http://local.invalid//evil.com")).toBe("/dashboard");
    expect(safeNext("//local.invalid//evil.com")).toBe("/dashboard");
  });

  it("rejects auth pages", () => {
    expect(safeNext("/login")).toBe("/dashboard");
    expect(safeNext("/signup")).toBe("/dashboard");
    expect(safeNext("/login/foo")).toBe("/dashboard");
    expect(safeNext("/forgot-password")).toBe("/dashboard");
    expect(safeNext("/reset-password")).toBe("/dashboard");
    expect(safeNext("/reset-password?token=abc")).toBe("/dashboard");
  });

  it("uses the first value of a duplicate query", () => {
    expect(safeNext(["/dashboard/montreuil", "https://evil.com"])).toBe(
      "/dashboard/montreuil",
    );
  });
});

describe("firstSearchParam", () => {
  it("returns the first array entry", () => {
    expect(firstSearchParam(["/a", "/b"])).toBe("/a");
  });
});
