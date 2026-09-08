import { BboxExplorer } from "@/components/dashboard/bbox-explorer";
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
      <PageIntro title="Voirie" dataset={[DATASETS.works, DATASETS.street]}>
        Chantiers à J-1 et signalements Dans Ma Rue. La carte charge uniquement la zone visible.
      </PageIntro>
      <KpiStrip
        items={[
          { label: "Chantiers", value: worksCount.toLocaleString("fr-FR") },
          { label: "Signalements", value: streetCount.toLocaleString("fr-FR") },
        ]}
      />
      <DatasetTabs
        active={active === "street" ? "/dashboard/traffic?tab=street" : "/dashboard/traffic"}
        tabs={[
          { href: "/dashboard/traffic", label: "Chantiers" },
          { href: "/dashboard/traffic?tab=street", label: "Dans Ma Rue" },
        ]}
      />
      <BboxExplorer
        dataset={dataset}
        initial={loaded.page}
        favoriteIds={loaded.favoriteIds}
        extraWhere={loaded.where}
      />
    </div>
  );
}
