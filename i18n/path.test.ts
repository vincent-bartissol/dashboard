import { describe, expect, it } from "vitest";
import {
  localeFromPath,
  stripLocalePrefix,
  withLocale,
  withLocaleInAbsoluteUrl,
} from "./path";

describe("locale path helpers", () => {
  it("reads the locale from a prefixed path", () => {
    expect(localeFromPath("/en/login")).toBe("en");
    expect(localeFromPath("/login")).toBe("fr");
  });

  it("strips and re-applies prefixes", () => {
    expect(stripLocalePrefix("/es/dashboard/velib")).toBe("/dashboard/velib");
    expect(withLocale("/dashboard", "en")).toBe("/en/dashboard");
    expect(withLocale("/fr/login", "es")).toBe("/es/login");
  });

  it("prefixes public URLs but leaves API URLs alone", () => {
    expect(withLocaleInAbsoluteUrl("http://localhost:3000/reset-password?token=a", "en")).toBe(
      "http://localhost:3000/en/reset-password?token=a",
    );
    expect(
      withLocaleInAbsoluteUrl("http://localhost:3000/api/auth/verify-email?token=a", "en"),
    ).toBe("http://localhost:3000/api/auth/verify-email?token=a");
  });
});
