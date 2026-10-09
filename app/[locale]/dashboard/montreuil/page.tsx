import { DynamicBikeCountChart } from "@/components/dashboard/dynamic-bike-count-chart";
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
import type { MapMarker } from "@/lib/opendata/markers";
import { requireSession } from "@/lib/session";
import type { ReactNode } from "react";
import { getFormatter, getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/ui/heading";

const MONTREUIL_VELIB = `nom_arrondissement_communes = 'Montreuil'`;

function MontreuilBikeSourceLink({
  href,
  opensInNewTab,
  children,
}: Readonly<{ href: string; opensInNewTab: string; children: ReactNode }>) {
  return (
    <a className="text-heading hover:underline" href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> {opensInNewTab}</span>
    </a>
  );
}

export default async function MontreuilPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ tab?: string }>;
}>) {
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

      {await montreuilActivePanel(active, tabData, mapProps, { t, datasets, common })}
    </div>
  );
}

type MontreuilTabData = Awaited<ReturnType<typeof loadMontreuilTab>>;

type MontreuilMapProps = {
  mapCenter: { lat: number; lon: number };
  mapZoom: number;
  extraMarkers: MapMarker[];
};

type MontreuilCopy = {
  t: Awaited<ReturnType<typeof getTranslations<"Pages.montreuil">>>;
  datasets: Awaited<ReturnType<typeof getTranslations<"Datasets">>>;
  common: Awaited<ReturnType<typeof getTranslations<"Common">>>;
};

async function montreuilExplorerPanel(
  dataset: (typeof DATASETS)[keyof typeof DATASETS],
  loaded: NonNullable<MontreuilTabData["velib"]>,
  mapProps: MontreuilMapProps,
  extras?: Readonly<{
    district?: string;
    colorScheme?: "velib" | "status";
    descriptionKeys?: string[];
  }>,
) {
  return (
    <InfiniteThemeExplorer
      dataset={await localizeExplorerDataset(dataset)}
      initial={loaded.table}
      mapRecords={loaded.markers.results}
      favoriteIds={loaded.favoriteIds}
      initialError={loaded.ok ? null : loaded.error}
      {...extras}
      {...mapProps}
    />
  );
}

function montreuilBikeSourceChunk(
  chunks: ReactNode,
  opensInNewTab: string,
) {
  return (
    <MontreuilBikeSourceLink
      href={DATASETS.montreuilBikes.sourceUrl}
      opensInNewTab={opensInNewTab}
    >
      {chunks}
    </MontreuilBikeSourceLink>
  );
}

async function montreuilWaterPanel(
  tabData: MontreuilTabData,
  mapProps: MontreuilMapProps,
  datasets: MontreuilCopy["datasets"],
) {
  if (!tabData.fountains || !tabData.mist) return null;
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SectionTitle>{datasets("montreuilFountains.title")}</SectionTitle>
        {await montreuilExplorerPanel(DATASETS.montreuilFountains, tabData.fountains, mapProps, {
          colorScheme: "status",
        })}
      </div>
      <div className="space-y-4">
        <SectionTitle>{datasets("montreuilMist.title")}</SectionTitle>
        {await montreuilExplorerPanel(DATASETS.montreuilMist, tabData.mist, mapProps)}
      </div>
    </div>
  );
}

function montreuilBikesPanel(tabData: MontreuilTabData, copy: MontreuilCopy) {
  if (!tabData.bikeCounts) return null;
  const opensInNewTab = copy.common("opensInNewTab");
  return (
    <div className="space-y-6">
      <DynamicBikeCountChart records={tabData.bikeCounts.page.results} />
      <p className="text-sm text-muted">
        {copy.t.rich("bikeSource", {
          link: (chunks) => montreuilBikeSourceChunk(chunks, opensInNewTab),
        })}
      </p>
    </div>
  );
}

async function montreuilActivePanel(
  active: "velib" | "trees" | "gardens" | "water" | "bikes",
  tabData: MontreuilTabData,
  mapProps: MontreuilMapProps,
  copy: MontreuilCopy,
): Promise<ReactNode> {
  if (active === "velib" && tabData.velib) {
    return montreuilExplorerPanel(DATASETS.velib, tabData.velib, mapProps, {
      district: "montreuil",
      colorScheme: "velib",
      descriptionKeys: ["numbikesavailable", "numdocksavailable"],
    });
  }
  if (active === "trees" && tabData.trees) {
    return montreuilExplorerPanel(DATASETS.montreuilTrees, tabData.trees, mapProps);
  }
  if (active === "gardens" && tabData.gardens) {
    return montreuilExplorerPanel(DATASETS.montreuilGardens, tabData.gardens, mapProps);
  }
  if (active === "water") {
    return montreuilWaterPanel(tabData, mapProps, copy.datasets);
  }
  if (active === "bikes") {
    return montreuilBikesPanel(tabData, copy);
  }
  return null;
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
