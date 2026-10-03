import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PageTitle } from "@/components/ui/heading";
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
    <AuthFrame>
      <PageTitle>{t("forgotTitle")}</PageTitle>
      <p className="mt-1 mb-6 text-sm text-muted">{t("forgotBody")}</p>
      <ForgotPasswordForm />
      <p className="mt-4 text-sm text-muted">
        <Link href="/login" className="font-medium text-heading hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </AuthFrame>
  );
}
