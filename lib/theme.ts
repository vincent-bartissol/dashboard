export const THEME_COOKIE = "theme";
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export type ColorScheme = "light" | "dark" | "system";

export function parseTheme(value: string | undefined | null): ColorScheme {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function themeIsDark(theme: ColorScheme, prefersDark: boolean): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return prefersDark;
}

export function readThemeCookie(): ColorScheme {
  if (typeof document === "undefined") return "system";
  const match = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  return parseTheme(match ? decodeURIComponent(match[1]) : undefined);
}

export function themeCookieValue(
  theme: ColorScheme,
  secure = typeof location !== "undefined" && location.protocol === "https:",
) {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${THEME_MAX_AGE}; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
}

export function writeThemeCookie(theme: ColorScheme) {
  document.cookie = themeCookieValue(theme);
}

export function applyThemeClass(
  theme: ColorScheme,
  prefersDark = typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches,
) {
  const dark = themeIsDark(theme, prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

/** Runs before paint so the first frame matches the cookie / system preference. */
export const THEME_SCRIPT = `(function(){try{var t="system";var m=document.cookie.match(/(?:^|; )theme=([^;]*)/);if(m)t=decodeURIComponent(m[1]);if(t!=="light"&&t!=="dark")t="system";var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);document.documentElement.style.colorScheme=dark?"dark":"light";}catch(e){}})();`;
