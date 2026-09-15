import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getSessionCookie } from "better-auth/cookies";
import { routing } from "@/i18n/routing";
import { localeFromPath, stripLocalePrefix, withLocale } from "@/i18n/path";

const handleI18n = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathAfterLocale = stripLocalePrefix(pathname);
  const locale = localeFromPath(pathname);

  if (pathAfterLocale.startsWith("/dashboard") && !getSessionCookie(request)) {
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set("next", withLocale(pathAfterLocale, locale));
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/dev") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/", "/(fr|en|es)/:path*", "/((?!api|_next|_vercel|dev|favicon.ico|.*\\..*).*)"],
};
