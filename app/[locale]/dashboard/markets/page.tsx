import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { fetchCount, formatCount, joinWhere } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function MarketsPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.markets");
  const format = await getFormatter();
  const loaded = await loadThemeExplorer(DATASETS.markets, session.user.id);
  const foodCount = await fetchCount(
    DATASETS.markets.id,
    DATASETS.markets.revalidate,
    joinWhere(loaded.where, "produit like '*Aliment*'"),
  );

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.markets}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error || foodCount.error} />
      <KpiStrip
        items={[
          {
            label: t("markets"),
            value: loaded.ok ? format.number(loaded.table.total_count) : "—",
          },
          { label: t("food"), value: formatCount(foodCount, (value) => format.number(value)) },
        ]}
      />
      <InfiniteThemeExplorer
        dataset={await localizeExplorerDataset(DATASETS.markets)}
        initial={loaded.table}
        mapRecords={loaded.markers.results}
        favoriteIds={loaded.favoriteIds}
        initialError={loaded.ok ? null : loaded.error}
        descriptionKeys={["jours_tenue", "produit"]}
      />
    </div>
  );
}
