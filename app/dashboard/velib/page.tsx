import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function VelibPage() {
  const session = await requireSession();
  const { page, favoriteIds, error } = await loadTheme(DATASETS.velib, session.user.id);
  const bikes = page.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const docks = page.results.reduce((sum, row) => sum + Number(row.numdocksavailable ?? 0), 0);
  const ebikes = page.results.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageIntro title="Vélib’" dataset={DATASETS.velib}>
        Disponibilité temps réel des stations Vélib’ Métropole. Vert : plus de 5 vélos, orange :
        quelques-uns, rouge : aucun.
      </PageIntro>
      <DatasetNotice error={error} />
      <KpiStrip
        items={[
          { label: "Stations", value: page.total_count.toLocaleString("fr-FR") },
          { label: "Vélos", value: bikes.toLocaleString("fr-FR") },
          { label: "Électriques", value: ebikes.toLocaleString("fr-FR") },
          { label: "Bornettes libres", value: docks.toLocaleString("fr-FR") },
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
