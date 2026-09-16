import { describe, expect, it } from "vitest";
import { parseTheme, themeCookieValue, themeIsDark } from "./theme";

describe("parseTheme", () => {
  it("keeps a valid scheme", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBe("system");
  });

  it("falls back to system", () => {
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme("")).toBe("system");
    expect(parseTheme("sepia")).toBe("system");
  });
});

describe("themeCookieValue", () => {
  it("adds Secure on HTTPS", () => {
    expect(themeCookieValue("dark", true)).toContain("; Secure");
    expect(themeCookieValue("dark", false)).not.toContain("Secure");
  });
});

describe("themeIsDark", () => {
  it("follows the explicit scheme", () => {
    expect(themeIsDark("dark", false)).toBe(true);
    expect(themeIsDark("light", true)).toBe(false);
  });

  it("follows the system preference", () => {
    expect(themeIsDark("system", true)).toBe(true);
    expect(themeIsDark("system", false)).toBe(false);
  });
});
