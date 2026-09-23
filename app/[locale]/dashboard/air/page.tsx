import { getTranslations } from "next-intl/server";
import { AirCharts } from "@/components/dashboard/air-charts";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { fetchAllRecords } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function AirPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.air");
  const [loaded, charts] = await Promise.all([
    loadThemeExplorer(DATASETS.air, session.user.id),
    fetchAllRecords(DATASETS.air.id, DATASETS.air.revalidate, { max: 200 }),
  ]);
  const chartRecords = charts.ok ? charts.page.results : loaded.table.results;
  const latest = [...chartRecords].sort((a, b) =>
    String(b.annee).localeCompare(String(a.annee)),
  )[0];
  const dash = !loaded.ok || !latest;

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.air}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error || charts.error} />
      <KpiStrip
        items={[
          { label: t("latestYear"), value: dash ? "—" : String(latest?.annee) },
          { label: t("goodDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_bonne ?? 0) },
          { label: t("averageDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_moyenne ?? 0) },
          { label: t("badDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_mauvaise ?? 0) },
        ]}
      />
      <AirCharts records={chartRecords} />
      <InfiniteThemeExplorer
        dataset={await localizeExplorerDataset(DATASETS.air)}
        initial={loaded.table}
        mapRecords={loaded.markers.results}
        favoriteIds={loaded.favoriteIds}
        initialError={loaded.ok ? null : loaded.error}
      />
    </div>
  );
}
