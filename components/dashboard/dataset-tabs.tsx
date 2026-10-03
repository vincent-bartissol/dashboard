"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function DatasetTabs({
  tabs,
  active,
  ariaLabel,
}: {
  tabs: { href: string; label: string }[];
  active: string;
  ariaLabel?: string;
}) {
  const t = useTranslations("Explorer");
  return (
    <nav
      className="flex flex-wrap gap-0 border-b border-line"
      aria-label={ariaLabel ?? t("datasetTabs")}
    >
      {tabs.map((tab) => {
        const current = tab.href === active;
        const className = `rounded-none border-b-2 px-4 py-2 text-sm transition ${
          current
            ? "border-accent font-medium text-heading"
            : "border-transparent text-muted hover:text-heading"
        }`;
        if (tab.href.startsWith("/dev")) {
          return (
            <a
              key={tab.href}
              href={tab.href}
              className={className}
              aria-current={current ? "page" : undefined}
            >
              {tab.label}
            </a>
          );
        }
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={className}
            aria-current={current ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
