import { setRequestLocale } from "next-intl/server";
import { isAppLocale, routing, type AppLocale } from "@/i18n/routing";

export async function bindLocale(params: Promise<{ locale: string }>): Promise<AppLocale> {
  const { locale: raw } = await params;
  const locale = isAppLocale(raw) ? raw : routing.defaultLocale;
  setRequestLocale(locale);
  return locale;
}
