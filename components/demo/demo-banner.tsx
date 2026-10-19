"use client";

import { useTranslations } from "next-intl";

export function DemoBanner() {
  const t = useTranslations("Demo");
  return (
    <div
      role="status"
      className="border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-sm text-heading"
    >
      {t("banner")}
    </div>
  );
}
