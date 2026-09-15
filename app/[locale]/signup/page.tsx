import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/heading";
import { requireGuest } from "@/lib/session";

export default async function SignupPage({
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
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <PageTitle>{t("signupTitle")}</PageTitle>
          <p className="mt-1 mb-6 text-sm text-muted">{t("signupBody")}</p>
          <Suspense>
            <AuthForm mode="signup" />
          </Suspense>
          <p className="mt-4 text-sm text-muted">
            {t("hasAccount")}{" "}
            <Link href="/login" className="font-medium text-navy hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
