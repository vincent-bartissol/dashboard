import { PageIntro } from "@/components/dashboard/page-intro";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { Card } from "@/components/ui/card";
import { getProfile } from "@/lib/actions/profile";
import { requireSession } from "@/lib/session";

export default async function ProfilePage() {
  const session = await requireSession();
  const profile = await getProfile(session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title="Profil">
        Votre territoire préféré sert de filtre par défaut (arrondissement parisien ou Montreuil).
      </PageIntro>
      <Card className="max-w-lg">
        <dl className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Nom</dt>
            <dd>{session.user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">E-mail</dt>
            <dd>{session.user.email}</dd>
          </div>
        </dl>
        <ProfileForm arrondissement={profile.arrondissement} />
      </Card>
    </div>
  );
}
