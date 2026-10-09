import { routing, isAppLocale, type AppLocale } from "@/i18n/routing";
import { localeFromPath, stripLocalePrefix, withLocale } from "@/i18n/path";

const AUTH_PAGES = new Set(["login", "signup", "forgot-password", "reset-password"]);

export function firstSearchParam(value?: string | string[] | null) {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function safeNext(nextPath?: string | string[] | null, locale?: string) {
  const explicit: AppLocale | undefined = isAppLocale(locale) ? locale : undefined;
  const raw = firstSearchParam(nextPath);
  const fallbackLocale = explicit ?? routing.defaultLocale;
  const fallback = withLocale("/dashboard", fallbackLocale);
  if (!raw) return fallback;
  try {
    const url = new URL(raw, "https://local.invalid");
    if (url.origin !== "https://local.invalid") return fallback;
    const path = url.pathname;
    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    const rest = stripLocalePrefix(path);
    const resolved = explicit ?? localeFromPath(path);
    if (AUTH_PAGES.has(rest.split("/").find(Boolean) ?? "")) {
      return withLocale("/dashboard", resolved);
    }
    return `${withLocale(rest, resolved)}${url.search}`;
  } catch {
    return fallback;
  }
}
