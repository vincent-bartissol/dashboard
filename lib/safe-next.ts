const FALLBACK = "/dashboard";

export function firstSearchParam(value?: string | string[] | null) {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function safeNext(nextPath?: string | string[] | null) {
  const raw = firstSearchParam(nextPath);
  if (!raw) return FALLBACK;
  try {
    const url = new URL(raw, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return FALLBACK;
    const path = url.pathname;
    if (!path.startsWith("/") || path.startsWith("//")) return FALLBACK;
    if (
      path === "/login" ||
      path === "/signup" ||
      path === "/forgot-password" ||
      path === "/reset-password" ||
      path.startsWith("/login/") ||
      path.startsWith("/signup/") ||
      path.startsWith("/forgot-password/") ||
      path.startsWith("/reset-password/")
    ) {
      return FALLBACK;
    }
    return `${path}${url.search}`;
  } catch {
    return FALLBACK;
  }
}
