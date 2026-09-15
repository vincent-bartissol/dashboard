import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
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
  return session;
}

export async function requireGuest(nextPath?: string | string[]) {
  const session = await getSession();
  if (session) {
    const locale = await getLocale();
    redirect({ href: stripLocalePrefix(safeNext(nextPath, locale)), locale });
  }
}
