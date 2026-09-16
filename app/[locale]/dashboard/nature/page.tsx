import { getFormatter, getTranslations } from "next-intl/server";
import { BboxExplorer } from "@/components/dashboard/bbox-explorer";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchCount, formatCount } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function NaturePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const t = await getTranslations("Pages.nature");
  const format = await getFormatter();
  const { tab } = await searchParams;
  const active = tab === "parks" ? "parks" : "trees";
  const dataset = DATASETS[active];
  const [loaded, treeCount, parkCount] = await Promise.all([
    loadTheme(dataset, session.user.id),
    fetchCount(DATASETS.trees.id, DATASETS.trees.revalidate),
    fetchCount(DATASETS.parks.id, DATASETS.parks.revalidate),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={[DATASETS.trees, DATASETS.parks]}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error || treeCount.error || parkCount.error} />
      <KpiStrip
        items={[
          { label: t("trees"), value: formatCount(treeCount, (value) => format.number(value)) },
          { label: t("parks"), value: formatCount(parkCount, (value) => format.number(value)) },
        ]}
      />
      <DatasetTabs
        active={active === "parks" ? "/dashboard/nature?tab=parks" : "/dashboard/nature"}
        tabs={[
          { href: "/dashboard/nature", label: t("trees") },
          { href: "/dashboard/nature?tab=parks", label: t("parks") },
        ]}
      />
      {dataset.bbox ? (
        <BboxExplorer
          dataset={dataset}
          initial={loaded.page}
          favoriteIds={loaded.favoriteIds}
        />
      ) : (
        <ThemeExplorer
          dataset={dataset}
          records={loaded.page.results}
          totalCount={loaded.page.total_count}
          favoriteIds={loaded.favoriteIds}
        />
      )}
    </div>
  );
}
