import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchCount } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
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
    loadTheme(dataset, session.user.id),
    fetchCount(DATASETS.fountains.id, DATASETS.fountains.revalidate),
    fetchCount(DATASETS.toilets.id, DATASETS.toilets.revalidate),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={[DATASETS.fountains, DATASETS.toilets]}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error} />
      <KpiStrip
        items={[
          { label: t("fountains"), value: format.number(fountainCount) },
          { label: t("toilets"), value: format.number(toiletCount) },
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
      <ThemeExplorer
        dataset={dataset}
        records={loaded.page.results}
        totalCount={loaded.page.total_count}
        favoriteIds={loaded.favoriteIds}
        colorScheme="status"
      />
    </div>
  );
}
