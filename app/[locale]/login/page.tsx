import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";
import { requireGuest } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  await requireGuest(next);
  const t = await getTranslations("Auth");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="auth" />
      <main id="main" className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <PageTitle>{t("loginTitle")}</PageTitle>
          <p className="mt-1 mb-6 text-sm text-muted">{t("loginBody")}</p>
          <Suspense>
            <AuthForm mode="login" />
          </Suspense>
          <p className="mt-4 text-sm text-muted">
            {t("noAccount")}{" "}
            <Link href="/signup" className="font-medium text-heading hover:underline">
              {t("createAccount")}
            </Link>
          </p>
          <p className="mt-2 text-sm text-muted">
            <Link href="/forgot-password" className="font-medium text-heading hover:underline">
              {t("forgotLink")}
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
