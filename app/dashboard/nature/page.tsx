import { BboxExplorer } from "@/components/dashboard/bbox-explorer";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { DatasetTabs } from "@/components/dashboard/dataset-tabs";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { fetchCount } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function NaturePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
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
      <PageIntro title="Nature" dataset={[DATASETS.trees, DATASETS.parks]}>
        Arbres d’alignement (carte par emprise, jamais les 200&nbsp;000 d’un coup) et espaces
        verts municipaux.
      </PageIntro>
      <DatasetNotice error={loaded.error} />
      <KpiStrip
        items={[
          { label: "Arbres", value: treeCount.toLocaleString("fr-FR") },
          { label: "Espaces verts", value: parkCount.toLocaleString("fr-FR") },
        ]}
      />
      <DatasetTabs
        active={active === "parks" ? "/dashboard/nature?tab=parks" : "/dashboard/nature"}
        tabs={[
          { href: "/dashboard/nature", label: "Arbres" },
          { href: "/dashboard/nature?tab=parks", label: "Espaces verts" },
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
