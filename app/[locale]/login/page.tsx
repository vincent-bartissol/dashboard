import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { PageTitle } from "@/components/ui/heading";
import { bindLocale } from "@/lib/demo/locale-page";

export default async function LoginPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <AuthFrame locale={locale}>
      <PageTitle>{t("loginTitle")}</PageTitle>
      <p className="mt-1 mb-6 text-sm text-muted">{t("loginBody")}</p>
      <AuthForm mode="login" />
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
    </AuthFrame>
  );
}
