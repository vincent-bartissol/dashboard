import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Button } from "@/components/ui/button";
import { Card, KpiCard } from "@/components/ui/card";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { fetchAggregate, fetchCount, fetchRecordsSafe } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";

export default async function Home() {
  const [velibCount, treeCount, eventCount, velibAgg, atmo] = await Promise.all([
    fetchCount(DATASETS.velib.id, DATASETS.velib.revalidate),
    fetchCount(DATASETS.trees.id, DATASETS.trees.revalidate),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate),
    fetchAggregate<{ bikes?: number }>(
      DATASETS.velib.id,
      "sum(numbikesavailable) as bikes",
      DATASETS.velib.revalidate,
    ),
    fetchRecordsSafe<{
      annee?: string;
      ind_jour_qa_bonne?: number;
      ind_jour_qa_moyenne?: number;
    }>(DATASETS.air.id, { limit: 5, orderBy: "annee desc" }, DATASETS.air.revalidate),
  ]);

  const bikes = Number(velibAgg.page.results[0]?.bikes ?? 0);
  const latestAir = atmo.page.results[0];
  const openDataError = [velibAgg, atmo].some((result) => !result.ok);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-gold">
                Ville de Paris · Montreuil · Open Data
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Un tableau de bord pour lire Paris en données publiques.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/80">
                Paris Ouverte rassemble Vélib’, arbres, qualité de l’air, fontaines,
                événements, chantiers et marchés. La page d’accueil est ouverte à toutes
                et tous. L’espace privé, après inscription, permet de filtrer, cartographier
                et enregistrer des favoris.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/signup">Créer un compte</Button>
                <Button href="/login" variant="ghost" className="border-white/20 bg-transparent text-white hover:border-white/40">
                  Se connecter
                </Button>
              </div>
            </div>
            <Card className="bg-paper text-ink">
              <p className="text-sm font-medium text-gold">En direct d’opendata.paris.fr</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Stations Vélib’</dt>
                  <dd className="font-semibold">{velibCount.toLocaleString("fr-FR")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Vélos disponibles</dt>
                  <dd className="font-semibold">{bikes.toLocaleString("fr-FR")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Arbres recensés</dt>
                  <dd className="font-semibold">{treeCount.toLocaleString("fr-FR")}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Événements</dt>
                  <dd className="font-semibold">{eventCount.toLocaleString("fr-FR")}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-semibold text-navy">Chiffres clés</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Ces indicateurs sont calculés côté serveur à partir de l’API Explore v2.1,
            sans clé, et mis en cache selon la fraîcheur de chaque jeu.
          </p>
          {openDataError ? <div className="mt-4"><DatasetNotice error="opendata" /></div> : null}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Vélib’"
              value={bikes.toLocaleString("fr-FR")}
              hint="vélos disponibles maintenant"
            />
            <KpiCard
              label="Nature"
              value={treeCount.toLocaleString("fr-FR")}
              hint="arbres d’alignement et d’espaces verts"
            />
            <KpiCard
              label="Air"
              value={latestAir ? `${latestAir.ind_jour_qa_bonne ?? "—"} j.` : "—"}
              hint={
                latestAir
                  ? `jours « bonne » qualité en ${latestAir.annee}`
                  : "indice ATMO indisponible"
              }
            />
            <KpiCard
              label="Agenda"
              value={eventCount.toLocaleString("fr-FR")}
              hint="événements Que faire à Paris"
            />
          </div>
        </section>

        <section className="border-y border-line bg-paper">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-3">
            {[
              {
                title: "Paris et Montreuil",
                body: "Vélib’, nature, air, commodités, événements, voirie, marchés, plus une page Montreuil autour de Robespierre : chaque jeu a sa carte, son tableau et ses indicateurs.",
              },
              {
                title: "Un espace privé",
                body: "Créez un compte, choisissez un arrondissement ou Montreuil (Robespierre), enregistrez des stations, des arbres ou des marchés dans vos favoris.",
              },
              {
                title: "Aussi Montreuil",
                body: "Autour de Robespierre et de la rue Étienne Marcel : portail Montreuil Data, Vélib’ Métropole, agenda 93100 et compteur vélos.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-semibold text-navy">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-navy px-8 py-10 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Passer dans l’espace privé</h2>
              <p className="mt-2 max-w-xl text-white/75">
                L’inscription est locale (e-mail et mot de passe). Aucun réseau social.
              </p>
            </div>
            <Button href="/signup">S’inscrire</Button>
          </div>
          <p className="mt-6 text-sm text-muted">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-navy hover:underline">
              Se connecter
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
