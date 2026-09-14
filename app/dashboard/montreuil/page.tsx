import { BikeCountChart } from "@/components/dashboard/bike-count-chart";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchAggregate, fetchAllRecords, fetchCount } from "@/lib/opendata/client";
import { isoDateDaysAgo } from "@/lib/opendata/dates";
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

const MONTREUIL_VELIB = `nom_arrondissement_communes = 'Montreuil'`;

export default async function MontreuilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab } = await searchParams;
  const active =
    tab === "trees" || tab === "gardens" || tab === "water" || tab === "bikes" ? tab : "velib";
  const since = isoDateDaysAgo(7);

  const [velibCount, velibAgg, treeCount, gardenCount, eventCount, tabData] = await Promise.all([
    fetchCount(DATASETS.velib.id, DATASETS.velib.revalidate, MONTREUIL_VELIB),
    fetchAggregate<{ bikes?: number }>(
      DATASETS.velib.id,
      "sum(numbikesavailable) as bikes",
      DATASETS.velib.revalidate,
      { where: MONTREUIL_VELIB },
    ),
    fetchCount(DATASETS.montreuilTrees.id, DATASETS.montreuilTrees.revalidate, undefined, "montreuil"),
    fetchCount(
      DATASETS.montreuilGardens.id,
      DATASETS.montreuilGardens.revalidate,
      undefined,
      "montreuil",
    ),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate, `address_zipcode = '93100'`),
    loadMontreuilTab(active, session.user.id, since),
  ]);

  const bikes = Number(velibAgg.page.results[0]?.bikes ?? 0);
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
      <DatasetNotice error={tabData.error || (velibAgg.ok ? undefined : velibAgg.error)} />
      <KpiStrip
        items={[
          { label: "Vélib’ Montreuil", value: velibCount, hint: `${bikes} vélos dispo` },
          { label: "Arbres voirie", value: treeCount.toLocaleString("fr-FR") },
          { label: "Jardins / nature", value: gardenCount.toLocaleString("fr-FR") },
          { label: "Agenda 93100", value: eventCount.toLocaleString("fr-FR") },
        ]}
      />
      <DatasetTabs active={activeHref} tabs={[...TABS]} />

      {active === "velib" && tabData.velib ? (
        <ThemeExplorer
          dataset={DATASETS.velib}
          records={tabData.velib.page.results}
          totalCount={tabData.velib.page.total_count}
          favoriteIds={tabData.velib.favoriteIds}
          colorScheme="velib"
          descriptionKeys={["numbikesavailable", "numdocksavailable"]}
          {...mapProps}
        />
      ) : null}

      {active === "trees" && tabData.trees ? (
        <ThemeExplorer
          dataset={DATASETS.montreuilTrees}
          records={tabData.trees.page.results}
          totalCount={tabData.trees.page.total_count}
          favoriteIds={tabData.trees.favoriteIds}
          {...mapProps}
        />
      ) : null}

      {active === "gardens" && tabData.gardens ? (
        <ThemeExplorer
          dataset={DATASETS.montreuilGardens}
          records={tabData.gardens.page.results}
          totalCount={tabData.gardens.page.total_count}
          favoriteIds={tabData.gardens.favoriteIds}
          {...mapProps}
        />
      ) : null}

      {active === "water" && tabData.fountains && tabData.mist ? (
        <div className="space-y-6">
          <ThemeExplorer
            dataset={DATASETS.montreuilFountains}
            records={tabData.fountains.page.results}
            totalCount={tabData.fountains.page.total_count}
            favoriteIds={tabData.fountains.favoriteIds}
            colorScheme="status"
            {...mapProps}
          />
          <ThemeExplorer
            dataset={DATASETS.montreuilMist}
            records={tabData.mist.page.results}
            totalCount={tabData.mist.page.total_count}
            favoriteIds={tabData.mist.favoriteIds}
            {...mapProps}
          />
        </div>
      ) : null}

      {active === "bikes" && tabData.bikeCounts ? (
        <div className="space-y-6">
          <BikeCountChart records={tabData.bikeCounts.page.results} />
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

async function loadMontreuilTab(
  active: "velib" | "trees" | "gardens" | "water" | "bikes",
  userId: string,
  since: string,
) {
  if (active === "velib") {
    const velib = await loadTheme(DATASETS.velib, userId, MONTREUIL_VELIB, {
      ignoreProfile: true,
    });
    return { velib, error: velib.error };
  }
  if (active === "trees") {
    const trees = await loadTheme(DATASETS.montreuilTrees, userId);
    return { trees, error: trees.error };
  }
  if (active === "gardens") {
    const gardens = await loadTheme(DATASETS.montreuilGardens, userId);
    return { gardens, error: gardens.error };
  }
  if (active === "water") {
    const [fountains, mist] = await Promise.all([
      loadTheme(DATASETS.montreuilFountains, userId),
      loadTheme(DATASETS.montreuilMist, userId),
    ]);
    return { fountains, mist, error: fountains.error || mist.error };
  }
  const bikeCounts = await fetchAllRecords<{ date?: string; total?: number }>(
    DATASETS.montreuilBikes.id,
    DATASETS.montreuilBikes.revalidate,
    {
      host: "montreuil",
      where: `date >= date'${since}'`,
      orderBy: "date desc",
      max: 800,
    },
  );
  return { bikeCounts, error: bikeCounts.error };
}
