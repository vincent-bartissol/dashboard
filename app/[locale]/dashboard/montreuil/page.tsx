import { BikeCountChart } from "@/components/dashboard/bike-count-chart";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { fetchAggregate, fetchAllRecords, fetchCount, formatCount } from "@/lib/opendata/client";
import { isoDateDaysAgo } from "@/lib/opendata/dates";
import {
  DATASETS,
  MONTREUIL_LANDMARKS,
  ROBESPIERRE_CENTER,
} from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { requireSession } from "@/lib/session";
import { getFormatter, getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/ui/heading";

const MONTREUIL_VELIB = `nom_arrondissement_communes = 'Montreuil'`;

export default async function MontreuilPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const t = await getTranslations("Pages.montreuil");
  const datasets = await getTranslations("Datasets");
  const common = await getTranslations("Common");
  const landmarks = await getTranslations("Landmarks");
  const format = await getFormatter();
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
  const extraMarkers = MONTREUIL_LANDMARKS.map((item) => {
    const copy = item.id === "metro-robespierre" ? "metro" : "street";
    return {
      ...item,
      label: landmarks(`${copy}.label`),
      description: landmarks(`${copy}.description`),
    };
  });
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
        title={t("title")}
        dataset={[
          DATASETS.velib,
          DATASETS.montreuilTrees,
          DATASETS.montreuilGardens,
          DATASETS.montreuilFountains,
          DATASETS.montreuilBikes,
        ]}
      >
        {t("body")}
      </PageIntro>
      <DatasetNotice
        error={
          tabData.error ||
          velibAgg.error ||
          velibCount.error ||
          treeCount.error ||
          gardenCount.error ||
          eventCount.error
        }
      />
      <KpiStrip
        items={[
          {
            label: t("kpiVelib"),
            value: formatCount(velibCount, (value) => format.number(value)),
            hint: velibAgg.ok ? t("kpiVelibHint", { count: format.number(bikes) }) : undefined,
          },
          { label: t("kpiTrees"), value: formatCount(treeCount, (value) => format.number(value)) },
          { label: t("kpiGardens"), value: formatCount(gardenCount, (value) => format.number(value)) },
          { label: t("kpiEvents"), value: formatCount(eventCount, (value) => format.number(value)) },
        ]}
      />
      <DatasetTabs
        active={activeHref}
        tabs={[
          { href: "/dashboard/montreuil", label: t("velib") },
          { href: "/dashboard/montreuil?tab=trees", label: t("trees") },
          { href: "/dashboard/montreuil?tab=gardens", label: t("gardens") },
          { href: "/dashboard/montreuil?tab=water", label: t("water") },
          { href: "/dashboard/montreuil?tab=bikes", label: t("bikes") },
        ]}
      />

      {active === "velib" && tabData.velib ? (
        <InfiniteThemeExplorer
          dataset={await localizeExplorerDataset(DATASETS.velib)}
          initial={tabData.velib.table}
          mapRecords={tabData.velib.markers.results}
          favoriteIds={tabData.velib.favoriteIds}
          initialError={tabData.velib.ok ? null : tabData.velib.error}
          district="montreuil"
          colorScheme="velib"
          descriptionKeys={["numbikesavailable", "numdocksavailable"]}
          {...mapProps}
        />
      ) : null}

      {active === "trees" && tabData.trees ? (
        <InfiniteThemeExplorer
          dataset={await localizeExplorerDataset(DATASETS.montreuilTrees)}
          initial={tabData.trees.table}
          mapRecords={tabData.trees.markers.results}
          favoriteIds={tabData.trees.favoriteIds}
          initialError={tabData.trees.ok ? null : tabData.trees.error}
          {...mapProps}
        />
      ) : null}

      {active === "gardens" && tabData.gardens ? (
        <InfiniteThemeExplorer
          dataset={await localizeExplorerDataset(DATASETS.montreuilGardens)}
          initial={tabData.gardens.table}
          mapRecords={tabData.gardens.markers.results}
          favoriteIds={tabData.gardens.favoriteIds}
          initialError={tabData.gardens.ok ? null : tabData.gardens.error}
          {...mapProps}
        />
      ) : null}

      {active === "water" && tabData.fountains && tabData.mist ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <SectionTitle>{datasets("montreuilFountains.title")}</SectionTitle>
            <InfiniteThemeExplorer
              dataset={await localizeExplorerDataset(DATASETS.montreuilFountains)}
              initial={tabData.fountains.table}
              mapRecords={tabData.fountains.markers.results}
              favoriteIds={tabData.fountains.favoriteIds}
              initialError={tabData.fountains.ok ? null : tabData.fountains.error}
              colorScheme="status"
              {...mapProps}
            />
          </div>
          <div className="space-y-4">
            <SectionTitle>{datasets("montreuilMist.title")}</SectionTitle>
            <InfiniteThemeExplorer
              dataset={await localizeExplorerDataset(DATASETS.montreuilMist)}
              initial={tabData.mist.table}
              mapRecords={tabData.mist.markers.results}
              favoriteIds={tabData.mist.favoriteIds}
              initialError={tabData.mist.ok ? null : tabData.mist.error}
              {...mapProps}
            />
          </div>
        </div>
      ) : null}

      {active === "bikes" && tabData.bikeCounts ? (
        <div className="space-y-6">
          <BikeCountChart records={tabData.bikeCounts.page.results} />
          <p className="text-sm text-muted">
            {t.rich("bikeSource", {
              link: (chunks) => (
                <a
                  className="text-heading hover:underline"
                  href={DATASETS.montreuilBikes.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {chunks}
                  <span className="sr-only"> {common("opensInNewTab")}</span>
                </a>
              ),
            })}
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
    const velib = await loadThemeExplorer(DATASETS.velib, userId, {
      district: "montreuil",
      ignoreProfile: true,
    });
    return { velib, error: velib.error };
  }
  if (active === "trees") {
    const trees = await loadThemeExplorer(DATASETS.montreuilTrees, userId);
    return { trees, error: trees.error };
  }
  if (active === "gardens") {
    const gardens = await loadThemeExplorer(DATASETS.montreuilGardens, userId);
    return { gardens, error: gardens.error };
  }
  if (active === "water") {
    const [fountains, mist] = await Promise.all([
      loadThemeExplorer(DATASETS.montreuilFountains, userId),
      loadThemeExplorer(DATASETS.montreuilMist, userId),
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
