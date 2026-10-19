import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { PageTitle } from "@/components/ui/heading";
import { bindLocale } from "@/lib/demo/locale-page";

export default async function ResetPasswordPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <AuthFrame locale={locale}>
      <PageTitle>{t("resetTitle")}</PageTitle>
      <p className="mt-1 mb-6 text-sm text-muted">{t("resetBody")}</p>
      <ResetPasswordForm token="demo" />
      <p className="mt-4 text-sm text-muted">
        <Link href="/login" className="font-medium text-heading hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </AuthFrame>
  );
}
