import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/layout/wordmark";
import { SkipLink } from "@/components/layout/skip-link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { parseTheme } from "@/lib/theme";

export async function SiteHeader({ variant = "public" }: { variant?: "public" | "auth" }) {
  const session = await getSession();
  const t = await getTranslations("Nav");
  const theme = parseTheme((await cookies()).get("theme")?.value);

  return (
    <header className="relative border-b border-line bg-paper shadow-[inset_0_-2px_0_var(--accent)]">
      <SkipLink />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4">
        <Wordmark />
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <LocaleSwitcher />
          <ThemeToggle initial={theme} />
          {variant === "auth" ? null : session ? (
            <Button href="/dashboard" variant="secondary">
              {t("privateSpace")}
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button href="/login" variant="ghost">
                {t("login")}
              </Button>
              <Button href="/signup">{t("signup")}</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const common = await getTranslations("Common");
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
