import { getLocale } from "next-intl/server";
import { getBuildSession } from "@/lib/demo/session";
import { redirect } from "@/i18n/navigation";
import { stripLocalePrefix } from "@/i18n/path";
import { safeNext } from "@/lib/safe-next";

/** Build-time / static-export session (always the demo visitor). */
export async function getSession() {
  return getBuildSession();
}

export async function requireSession() {
  return getBuildSession();
}

export async function requireAdmin() {
  return getBuildSession();
}

export async function requireGuest(nextPath?: string | string[]) {
  // Static demo: guest pages are always reachable; client buttons create the session.
  void nextPath;
  void stripLocalePrefix;
  void safeNext;
  void redirect;
  void getLocale;
}
