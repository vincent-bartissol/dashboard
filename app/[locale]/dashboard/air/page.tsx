import { getTranslations } from "next-intl/server";
import { AirCharts } from "@/components/dashboard/air-charts";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function AirPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.air");
  const { page, favoriteIds, error, ok } = await loadTheme(DATASETS.air, session.user.id);
  const latest = [...page.results].sort((a, b) => String(b.annee).localeCompare(String(a.annee)))[0];
  const dash = !ok || !latest;

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.air}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={error} />
      <KpiStrip
        items={[
          { label: t("latestYear"), value: dash ? "—" : String(latest?.annee) },
          { label: t("goodDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_bonne ?? 0) },
          { label: t("averageDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_moyenne ?? 0) },
          { label: t("badDays"), value: dash ? "—" : Number(latest?.ind_jour_qa_mauvaise ?? 0) },
        ]}
      />
      <AirCharts records={page.results} />
      <ThemeExplorer
        dataset={DATASETS.air}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}
