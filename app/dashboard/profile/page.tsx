import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/actions/profile";
import { splitDisplayName } from "@/lib/profile-name";
import { requireSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await getProfile(session.user.id);
  const fromName = splitDisplayName(session.user.name ?? "");

  return (
    <div className="space-y-6">
      <PageIntro title="Profil">
        Mettez à jour votre prénom, votre nom et votre e-mail. Votre territoire préféré sert de
        filtre par défaut (arrondissement parisien ou Montreuil).
      </PageIntro>
      <Card className="max-w-lg">
        <ProfileForm
          firstName={profile.firstName ?? fromName.firstName}
          lastName={profile.lastName ?? fromName.lastName}
          email={session.user.email}
          arrondissement={profile.arrondissement}
        />
      </Card>
    </div>
  );
}
