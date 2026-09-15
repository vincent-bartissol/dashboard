import { getFormatter, getTranslations } from "next-intl/server";
import { BboxExplorer } from "@/components/dashboard/bbox-explorer";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { fetchCount } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function TrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const t = await getTranslations("Pages.traffic");
  const format = await getFormatter();
  const { tab } = await searchParams;
  const active = tab === "street" ? "street" : "works";
  const dataset = DATASETS[active];
  const [loaded, worksCount, streetCount] = await Promise.all([
    loadTheme(dataset, session.user.id),
    fetchCount(DATASETS.works.id, DATASETS.works.revalidate),
    fetchCount(DATASETS.street.id, DATASETS.street.revalidate),
  ]);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} dataset={[DATASETS.works, DATASETS.street]}>
        {t("body")}
      </PageIntro>
      <DatasetNotice error={loaded.error} />
      <KpiStrip
        items={[
          { label: t("works"), value: format.number(worksCount) },
          { label: t("reports"), value: format.number(streetCount) },
        ]}
      />
      <DatasetTabs
        active={active === "street" ? "/dashboard/traffic?tab=street" : "/dashboard/traffic"}
        tabs={[
          { href: "/dashboard/traffic", label: t("works") },
          { href: "/dashboard/traffic?tab=street", label: t("street") },
        ]}
      />
      <BboxExplorer
        dataset={dataset}
        initial={loaded.page}
        favoriteIds={loaded.favoriteIds}
      />
    </div>
  );
}
