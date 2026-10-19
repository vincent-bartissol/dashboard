import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { SkipLink } from "@/components/layout/skip-link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { DemoBanner } from "@/components/demo/demo-banner";

function headerSessionActions(
  variant: "public" | "auth",
  t: (key: "privateSpace" | "login" | "signup") => string,
): ReactNode {
  if (variant === "auth") return null;
  return (
    <div className="flex items-center gap-2">
      <Button href="/dashboard" variant="secondary">
        {t("privateSpace")}
      </Button>
      <Button href="/login" variant="ghost">
        {t("login")}
      </Button>
      <Button href="/signup">{t("signup")}</Button>
    </div>
  );
}

export async function SiteHeader({
  variant = "public",
  locale = "fr",
}: Readonly<{ variant?: "public" | "auth"; locale?: AppLocale }>) {
  const t = await getTranslations({ locale, namespace: "Nav" });

  return (
    <header className="relative border-b border-line bg-paper shadow-[inset_0_-2px_0_var(--accent)]">
      <DemoBanner />
      <SkipLink />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
        <Wordmark />
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LocaleSwitcher />
          <ThemeToggle initial="system" />
          {headerSessionActions(variant, t)}
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter({ locale = "fr" }: Readonly<{ locale?: AppLocale }>) {
  const t = await getTranslations({ locale, namespace: "Footer" });
  const common = await getTranslations({ locale, namespace: "Common" });
  return (
    <footer className="border-t border-line py-8 text-sm text-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("license")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/contact" className="font-medium text-heading hover:underline">
            {t("contact")}
          </Link>
          <a
            className="font-medium text-heading hover:underline"
            href="https://opendata.paris.fr"
            target="_blank"
            rel="noreferrer"
          >
            opendata.paris.fr{" "}
            <span className="sr-only">{common("opensInNewTab")}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
