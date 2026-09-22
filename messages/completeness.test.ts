import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";

const catalogs: Record<string, unknown> = { fr, en, es };

function flatten(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof nested === "object" && nested !== null && !Array.isArray(nested)
      ? flatten(nested, path)
      : [path];
  });
}

function emptyLeaves(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") {
    return value.trim() === "" && prefix ? [prefix] : [];
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return emptyLeaves(nested, path);
  });
}

describe("i18n message keys", () => {
  const frKeys = new Set(flatten(fr));

  it("has a catalog for every routed locale", () => {
    for (const locale of routing.locales) {
      expect(catalogs[locale], `messages/${locale}.json`).toBeDefined();
    }
  });

  it("uses fr as the default locale", () => {
    expect(routing.defaultLocale).toBe("fr");
  });

  for (const locale of routing.locales.filter((item) => item !== "fr")) {
    it(`${locale} matches the fr key tree`, () => {
      const keys = new Set(flatten(catalogs[locale]));
      expect([...keys].filter((key) => !frKeys.has(key)).sort()).toEqual([]);
      expect([...frKeys].filter((key) => !keys.has(key)).sort()).toEqual([]);
    });
  }

  for (const locale of routing.locales) {
    it(`${locale} has no empty leaf strings`, () => {
      expect(emptyLeaves(catalogs[locale]).sort()).toEqual([]);
    });
  }
});
