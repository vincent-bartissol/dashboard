import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageTitle } from "@/components/ui/heading";
import { firstSearchParam } from "@/lib/safe-next";
import { requireGuest } from "@/lib/session";

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{
    next?: string | string[];
    token?: string | string[];
    error?: string | string[];
  }>;
}>) {
  const params = await searchParams;
  await requireGuest(params.next);
  const token = firstSearchParam(params.token);
  const error = firstSearchParam(params.error);
  const t = await getTranslations("Auth");

  return (
    <AuthFrame>
      <PageTitle>{t("resetTitle")}</PageTitle>
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
    </AuthFrame>
  );
}
