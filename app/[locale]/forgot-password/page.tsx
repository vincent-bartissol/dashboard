import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { requireGuest } from "@/lib/session";

export default async function ForgotPasswordPage({
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
          <h1 className="text-2xl font-semibold text-heading">{t("forgotTitle")}</h1>
          <p className="mt-1 mb-6 text-sm text-muted">{t("forgotBody")}</p>
          <ForgotPasswordForm />
          <p className="mt-4 text-sm text-muted">
            <Link href="/login" className="font-medium text-heading hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
