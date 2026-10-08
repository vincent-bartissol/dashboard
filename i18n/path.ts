import type { AppLocale } from "@/i18n/routing";
import { isAppLocale, routing } from "@/i18n/routing";

export type { AppLocale };

export function localeFromPath(pathname: string): AppLocale {
  const first = pathname.split("/").find(Boolean);
  return isAppLocale(first) ? first : routing.defaultLocale;
}

function trimTrailingSlashes(path: string) {
  let end = path.length;
  while (end > 1 && path.charAt(end - 1) === "/") end -= 1;
  return path.slice(0, end) || "/";
}

export function stripLocalePrefix(pathname: string) {
  const parts = pathname.split("/");
  if (isAppLocale(parts[1])) {
    const rest = `/${parts.slice(2).join("/")}`;
    return rest === "/" ? "/" : trimTrailingSlashes(rest);
  }
  return pathname;
}

export function withLocale(pathname: string, locale: AppLocale = routing.defaultLocale) {
  const rest = stripLocalePrefix(pathname);
  if (rest === "/") return `/${locale}`;
  return `/${locale}${rest}`;
}

export function withLocaleInAbsoluteUrl(url: string, locale: AppLocale) {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/")) return url;
    parsed.pathname = withLocale(parsed.pathname, locale);
    return parsed.toString();
  } catch {
    return url;
  }
}
