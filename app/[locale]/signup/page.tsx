import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthFrame } from "@/components/auth/auth-frame";
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
    <AuthFrame>
      <PageTitle>{t("signupTitle")}</PageTitle>
      <p className="mt-1 mb-6 text-sm text-muted">{t("signupBody")}</p>
      <AuthForm mode="signup" next={next} />
      <p className="mt-4 text-sm text-muted">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-heading hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </AuthFrame>
  );
}
