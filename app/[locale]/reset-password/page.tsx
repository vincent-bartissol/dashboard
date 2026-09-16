import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Card } from "@/components/ui/card";
import { firstSearchParam } from "@/lib/safe-next";
import { requireGuest } from "@/lib/session";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    token?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  await requireGuest(params.next);
  const token = firstSearchParam(params.token);
  const error = firstSearchParam(params.error);
  const t = await getTranslations("Auth");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="auth" />
      <main id="main" className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-semibold text-heading">{t("resetTitle")}</h1>
          {token && !error ? (
            <>
              <p className="mt-1 mb-6 text-sm text-muted">{t("resetBody")}</p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <p className="mt-1 mb-6 text-sm text-muted">{t("resetInvalid")}</p>
              <p className="text-sm text-muted">
                <Link href="/forgot-password" className="font-medium text-heading hover:underline">
                  {t("forgotTitle")}
                </Link>
              </p>
            </>
          )}
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
