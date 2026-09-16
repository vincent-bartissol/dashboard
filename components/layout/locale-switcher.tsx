"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher({ invert = false }: { invert?: boolean }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Common");
  const frame = invert ? "border-white/20 bg-white/5 text-white" : "border-line bg-paper text-ink";

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <span className={invert ? "sr-only" : "text-muted"}>{t("localeSwitcher")}</span>
      <select
        className={`h-9 rounded-none border px-2 text-xs font-medium focus-field ${frame}`}
        value={locale}
        aria-label={t("localeSwitcher")}
        onChange={(event) => {
          const query = window.location.search.replace(/^\?/, "");
          const href = query ? `${pathname}?${query}` : pathname;
          router.replace(href, { locale: event.target.value as AppLocale });
        }}
      >
        {routing.locales.map((item) => (
          <option key={item} value={item}>
            {t(`locale.${item}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
