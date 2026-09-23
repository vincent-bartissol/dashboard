import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { fetchCount, formatCount } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function AmenitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const t = await getTranslations("Pages.amenities");
  const format = await getFormatter();
  const { tab } = await searchParams;
  const active = tab === "toilets" ? "toilets" : "fountains";
  const dataset = DATASETS[active];
  const [loaded, fountainCount, toiletCount] = await Promise.all([
    loadThemeExplorer(dataset, session.user.id),
    fetchCount(DATASETS.fountains.id, DATASETS.fountains.revalidate),
    fetchCount(DATASETS.toilets.id, DATASETS.toilets.revalidate),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={[DATASETS.fountains, DATASETS.toilets]}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error || fountainCount.error || toiletCount.error} />
      <KpiStrip
        items={[
          { label: t("fountains"), value: formatCount(fountainCount, (value) => format.number(value)) },
          { label: t("toilets"), value: formatCount(toiletCount, (value) => format.number(value)) },
        ]}
      />
      <DatasetTabs
        active={
          active === "toilets" ? "/dashboard/amenities?tab=toilets" : "/dashboard/amenities"
        }
        tabs={[
          { href: "/dashboard/amenities", label: t("fountains") },
          { href: "/dashboard/amenities?tab=toilets", label: t("toilets") },
        ]}
      />
      <InfiniteThemeExplorer
        dataset={await localizeExplorerDataset(dataset)}
        initial={loaded.table}
        mapRecords={loaded.markers.results}
        favoriteIds={loaded.favoriteIds}
        initialError={loaded.ok ? null : loaded.error}
        colorScheme="status"
      />
    </div>
  );
}
