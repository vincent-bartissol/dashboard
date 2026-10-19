import { bindLocale } from "@/lib/demo/locale-page";
import { getFormatter, getTranslations } from "next-intl/server";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadThemeExplorer } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function EventsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const session = await requireSession();
  const t = await getTranslations({ locale, namespace: "Pages.events" });
  const format = await getFormatter({ locale });
  const loaded = await loadThemeExplorer(DATASETS.events, session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={DATASETS.events} locale={locale}>
        {t("body")}
      </PageIntro>
      <InfiniteThemeExplorer
        dataset={await localizeExplorerDataset(DATASETS.events, locale)}
        initial={loaded.table}
        mapRecords={loaded.markers.results}
        favoriteIds={loaded.favoriteIds}
        initialError={loaded.ok ? null : loaded.error}
        descriptionKeys={["lead_text", "address_name"]}
      >
        <KpiStrip
          items={[
            {
              label: t("events"),
              value: loaded.ok ? format.number(loaded.table.total_count) : "—",
            },
          ]}
        />
      </InfiniteThemeExplorer>
    </div>
  );
}
