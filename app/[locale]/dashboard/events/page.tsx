import { getFormatter, getTranslations } from "next-intl/server";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function EventsPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.events");
  const format = await getFormatter();
  const { page, favoriteIds, error } = await loadTheme(DATASETS.events, session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.events}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={error} />
      <KpiStrip
        items={[
          { label: t("events"), value: format.number(page.total_count) },
          { label: t("shown"), value: format.number(page.results.length) },
        ]}
      />
      <ThemeExplorer
        dataset={DATASETS.events}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        descriptionKeys={["lead_text", "address_name"]}
      />
    </div>
  );
}
