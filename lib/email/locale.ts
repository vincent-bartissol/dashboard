import { cookies } from "next/headers";
import { isAppLocale, routing, type AppLocale } from "@/i18n/routing";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";

const MAIL = {
  fr: fr.Mail,
  en: en.Mail,
  es: es.Mail,
} as const;

export async function mailLocale(): Promise<AppLocale> {
  try {
    const value = (await cookies()).get("NEXT_LOCALE")?.value;
    if (isAppLocale(value)) return value;
  } catch {
    // Outside a request (tests, boot).
  }
  return routing.defaultLocale;
}

export function mailCopy(locale: AppLocale) {
  return MAIL[locale];
}

export function interpolate(template: string, values: Record<string, string>) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
