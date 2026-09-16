import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/heading";

export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <PageTitle>{t("title")}</PageTitle>
        <p className="mt-2 text-sm text-muted">{t("body")}</p>
        <div className="mt-6">
          <Button href="/">{t("home")}</Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          {t("or")}{" "}
          <Link href="/dashboard" className="font-medium text-heading hover:underline">
            {t("dashboard")}
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
