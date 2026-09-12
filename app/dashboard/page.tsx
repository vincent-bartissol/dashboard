
import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { Card } from "@/components/ui/card";
import { listFavorites } from "@/lib/actions/favorites";
import { getProfile } from "@/lib/actions/profile";
import { fetchCount, fetchAllRecords } from "@/lib/opendata/client";
import { arrondissementLabel } from "@/lib/opendata/arrondissement";
import { DATASETS } from "@/lib/opendata/datasets";
import { requireSession } from "@/lib/session";

const THEMES = [
  { href: "/dashboard/montreuil", title: "Montreuil · Robespierre", body: "Vélib’, arbres, jardins, fontaines et compteur rue Étienne Marcel." },
  { href: "/dashboard/velib", title: "Vélib’", body: "Disponibilité temps réel des stations." },
  { href: "/dashboard/nature", title: "Nature", body: "Arbres d’alignement et espaces verts." },
  { href: "/dashboard/air", title: "Air", body: "Jours par indice ATMO depuis 2021." },
  { href: "/dashboard/amenities", title: "Commodités", body: "Fontaines à boire et toilettes publiques." },
  { href: "/dashboard/events", title: "Événements", body: "Agenda Que faire à Paris." },
  { href: "/dashboard/traffic", title: "Voirie", body: "Chantiers et signalements Dans Ma Rue." },
  { href: "/dashboard/markets", title: "Marchés", body: "Marchés découverts, jours et horaires." },
];

export default async function DashboardPage() {
  const session = await requireSession();
  const [profile, favorites, velib, trees, events, fountains, markets] = await Promise.all([
    getProfile(session.user.id),
    listFavorites(session.user.id),
    fetchAllRecords<{ numbikesavailable?: number; ebike?: number; numdocksavailable?: number }>(
      DATASETS.velib.id,
      DATASETS.velib.revalidate,
      { max: 1600 },
    ),
    fetchCount(DATASETS.trees.id, DATASETS.trees.revalidate),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate),
    fetchCount(DATASETS.fountains.id, DATASETS.fountains.revalidate),
    fetchCount(DATASETS.markets.id, DATASETS.markets.revalidate),
  ]);

  const bikes = velib.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const ebikes = velib.results.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);

  return (
    <div>
      <PageIntro title="Vue d’ensemble">
        Bonjour {profile.firstName || session.user.name}. Filtre par défaut :{" "}
        {arrondissementLabel(profile.arrondissement)}.
      </PageIntro>
      <KpiStrip
        items={[
          { label: "Vélos dispo", value: bikes.toLocaleString("fr-FR"), hint: `${ebikes} électriques` },
          { label: "Arbres", value: trees.toLocaleString("fr-FR") },
          { label: "Événements", value: events.toLocaleString("fr-FR") },
          { label: "Favoris", value: favorites.length },
        ]}
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {THEMES.map((theme) => (
          <Link key={theme.href} href={theme.href}>
            <Card className="h-full transition hover:border-navy/30">
              <h2 className="text-lg font-semibold text-navy">{theme.title}</h2>
              <p className="mt-1 text-sm text-muted">{theme.body}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        {fountains.toLocaleString("fr-FR")} fontaines et {markets.toLocaleString("fr-FR")} marchés
        dans le catalogue. Ajustez votre arrondissement dans le{" "}
        <Link href="/dashboard/profile" className="text-navy hover:underline">
          profil
        </Link>
        .
      </p>
    </div>
  );
}
