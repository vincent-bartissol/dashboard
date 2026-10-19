import { bindLocale } from "@/lib/demo/locale-page";
import { getTranslations } from "next-intl/server";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card } from "@/components/ui/card";
import { BUILD_DEMO_USER } from "@/lib/demo/seed";
import { splitDisplayName } from "@/lib/profile-name";
import { requireSession } from "@/lib/session";

export default async function ProfilePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const session = await requireSession();
  const t = await getTranslations({ locale, namespace: "Pages.profile" });
  const fromName = splitDisplayName(session.user.name ?? BUILD_DEMO_USER.name);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} locale={locale}>{t("body")}</PageIntro>
      <Card className="max-w-lg">
        <ProfileForm
          firstName={BUILD_DEMO_USER.firstName || fromName.firstName}
          lastName={BUILD_DEMO_USER.lastName || fromName.lastName}
          email={session.user.email}
          emailVerified={session.user.emailVerified}
          arrondissement={BUILD_DEMO_USER.arrondissement}
        />
      </Card>
      <Card className="max-w-lg">
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
