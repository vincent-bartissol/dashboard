import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { isAdminUser, isBannedUser } from "@/lib/admin";
import { redirect } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/i18n/path";
import { safeNext } from "@/lib/safe-next";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect({ href: "/login", locale: await getLocale() });
    throw new Error("Unauthorized");
  }
  if (isBannedUser(session.user)) {
    redirect({ href: "/login", locale: await getLocale() });
    throw new Error("Banned");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (!isAdminUser(session.user)) {
    redirect({ href: "/dashboard", locale: await getLocale() });
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireGuest(nextPath?: string | string[]) {
  const session = await getSession();
  if (session && !isBannedUser(session.user)) {
    const locale = await getLocale();
    redirect({ href: stripLocalePrefix(safeNext(nextPath, locale)), locale });
  }
}
