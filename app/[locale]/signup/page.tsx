import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
import { PageTitle } from "@/components/ui/heading";
import { bindLocale } from "@/lib/demo/locale-page";

export default async function SignupPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Auth" });

  return (
    <AuthFrame locale={locale}>
      <PageTitle>{t("signupTitle")}</PageTitle>
      <p className="mt-1 mb-6 text-sm text-muted">{t("signupBody")}</p>
      <AuthForm mode="signup" />
      <p className="mt-4 text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-heading hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </AuthFrame>
  );
}
