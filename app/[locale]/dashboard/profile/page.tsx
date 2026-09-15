import { getTranslations } from "next-intl/server";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/db/queries";
import { splitDisplayName } from "@/lib/profile-name";
import { requireSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.profile");
  const profile = await getProfile(session.user.id);
  const fromName = splitDisplayName(session.user.name ?? "");

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
      <Card className="max-w-lg">
        <ProfileForm
          firstName={profile.firstName ?? fromName.firstName}
          lastName={profile.lastName ?? fromName.lastName}
          email={session.user.email}
          emailVerified={session.user.emailVerified}
          arrondissement={profile.arrondissement}
        />
      </Card>
      <Card className="max-w-lg">
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
