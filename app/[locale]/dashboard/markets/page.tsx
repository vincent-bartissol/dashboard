import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchCount, formatCount, joinWhere } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function MarketsPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.markets");
  const format = await getFormatter();
  const { page, favoriteIds, error, where } = await loadTheme(DATASETS.markets, session.user.id);
  const foodCount = await fetchCount(
    DATASETS.markets.id,
    DATASETS.markets.revalidate,
    joinWhere(where, "lower(produit) like '*aliment*'"),
  );

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.markets}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={error || foodCount.error} />
      <KpiStrip
        items={[
          { label: t("markets"), value: format.number(page.total_count) },
          { label: t("food"), value: formatCount(foodCount, (value) => format.number(value)) },
        ]}
      />
      <ThemeExplorer
        dataset={DATASETS.markets}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        descriptionKeys={["jours_tenue", "produit"]}
      />
    </div>
  );
}
