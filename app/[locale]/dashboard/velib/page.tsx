import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function VelibPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.velib");
  const format = await getFormatter();
  const { page, favoriteIds, error, ok } = await loadTheme(DATASETS.velib, session.user.id);
  const bikes = page.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const docks = page.results.reduce((sum, row) => sum + Number(row.numdocksavailable ?? 0), 0);
  const ebikes = page.results.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);
  const kpi = (value: number) => (ok ? format.number(value) : "—");

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.velib}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={error} />
      <KpiStrip
        items={[
          { label: t("stations"), value: kpi(page.total_count) },
          { label: t("bikes"), value: kpi(bikes) },
          { label: t("ebikes"), value: kpi(ebikes) },
          { label: t("docks"), value: kpi(docks) },
        ]}
      />
      <ThemeExplorer
        dataset={DATASETS.velib}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        colorScheme="velib"
        descriptionKeys={["numbikesavailable", "numdocksavailable"]}
      />
    </div>
  );
}
