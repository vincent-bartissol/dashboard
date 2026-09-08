import { BikeCountChart } from "@/components/dashboard/bike-count-chart";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchAllRecords, fetchCount } from "@/lib/opendata/client";
import {
  DATASETS,
  MONTREUIL_LANDMARKS,
  ROBESPIERRE_CENTER,
} from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

const TABS = [
  { href: "/dashboard/montreuil", label: "Vélib’" },
  { href: "/dashboard/montreuil?tab=trees", label: "Arbres" },
  { href: "/dashboard/montreuil?tab=gardens", label: "Jardins" },
  { href: "/dashboard/montreuil?tab=water", label: "Eau" },
  { href: "/dashboard/montreuil?tab=bikes", label: "Rue Étienne Marcel" },
] as const;

export default async function MontreuilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab } = await searchParams;
  const active = tab === "trees" || tab === "gardens" || tab === "water" || tab === "bikes" ? tab : "velib";
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [velib, trees, gardens, fountains, mist, bikeCounts, eventCount] = await Promise.all([
    loadTheme(DATASETS.velib, session.user.id, `nom_arrondissement_communes = 'Montreuil'`, {
      ignoreProfile: true,
    }),
    loadTheme(DATASETS.montreuilTrees, session.user.id),
    loadTheme(DATASETS.montreuilGardens, session.user.id),
    loadTheme(DATASETS.montreuilFountains, session.user.id),
    loadTheme(DATASETS.montreuilMist, session.user.id),
    fetchAllRecords<{ date?: string; total?: number }>(
      DATASETS.montreuilBikes.id,
      DATASETS.montreuilBikes.revalidate,
      {
        host: "montreuil",
        where: `date >= date'${since}'`,
        orderBy: "date desc",
        max: 800,
      },
    ),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate, `address_zipcode = '93100'`),
  ]);

  const bikes = velib.page.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const extraMarkers = MONTREUIL_LANDMARKS.map((item) => ({ ...item }));
  const mapProps = {
    mapCenter: ROBESPIERRE_CENTER,
    mapZoom: 15,
    extraMarkers,
  };
  const activeHref =
    active === "velib" ? "/dashboard/montreuil" : `/dashboard/montreuil?tab=${active}`;

  return (
    <div className="space-y-6">
      <PageIntro
        title="Montreuil · Robespierre"
        dataset={[
          DATASETS.velib,
          DATASETS.montreuilTrees,
          DATASETS.montreuilGardens,
          DATASETS.montreuilFountains,
          DATASETS.montreuilBikes,
        ]}
      >
        Quartier ouest : métro Robespierre, place de la République et rue Étienne Marcel.
        Données Ville de Montreuil, Vélib’ Métropole, Que faire à Paris et Île-de-France Mobilités
        (repère métro).
      </PageIntro>
      <KpiStrip
        items={[
          { label: "Vélib’ Montreuil", value: velib.page.total_count, hint: `${bikes} vélos dispo` },
          { label: "Arbres voirie", value: trees.page.total_count.toLocaleString("fr-FR") },
          { label: "Jardins / nature", value: gardens.page.total_count.toLocaleString("fr-FR") },
          { label: "Agenda 93100", value: eventCount.toLocaleString("fr-FR") },
        ]}
      />
      <DatasetTabs active={activeHref} tabs={[...TABS]} />

      {active === "velib" ? (
        <ThemeExplorer
          dataset={DATASETS.velib}
          records={velib.page.results}
          totalCount={velib.page.total_count}
          favoriteIds={velib.favoriteIds}
          colorScheme="velib"
          descriptionKeys={["numbikesavailable", "numdocksavailable"]}
          {...mapProps}
        />
      ) : null}

      {active === "trees" ? (
        <ThemeExplorer
          dataset={DATASETS.montreuilTrees}
          records={trees.page.results}
          totalCount={trees.page.total_count}
          favoriteIds={trees.favoriteIds}
          {...mapProps}
        />
      ) : null}

      {active === "gardens" ? (
        <ThemeExplorer
          dataset={DATASETS.montreuilGardens}
          records={gardens.page.results}
          totalCount={gardens.page.total_count}
          favoriteIds={gardens.favoriteIds}
          {...mapProps}
        />
      ) : null}

      {active === "water" ? (
        <div className="space-y-6">
          <ThemeExplorer
            dataset={DATASETS.montreuilFountains}
            records={fountains.page.results}
            totalCount={fountains.page.total_count}
            favoriteIds={fountains.favoriteIds}
            colorScheme="status"
            {...mapProps}
          />
          <ThemeExplorer
            dataset={DATASETS.montreuilMist}
            records={mist.page.results}
            totalCount={mist.page.total_count}
            favoriteIds={mist.favoriteIds}
            {...mapProps}
          />
        </div>
      ) : null}

      {active === "bikes" ? (
        <div className="space-y-6">
          <BikeCountChart records={bikeCounts.results} />
          <p className="text-sm text-muted">
            Compteur fixe rue Étienne Marcel (sens Paris / Croix de Chavaux). Source :{" "}
            <a
              className="text-navy hover:underline"
              href={DATASETS.montreuilBikes.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Montreuil Data
            </a>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
