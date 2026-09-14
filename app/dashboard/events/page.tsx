import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function EventsPage() {
  const session = await requireSession();
  const { page, favoriteIds, error } = await loadTheme(DATASETS.events, session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title="Événements" dataset={DATASETS.events}>
        Agenda participatif Que faire à Paris. Les points sans coordonnées valides n’apparaissent
        pas sur la carte.
      </PageIntro>
      <DatasetNotice error={error} />
      <KpiStrip
        items={[
          { label: "Événements", value: page.total_count.toLocaleString("fr-FR") },
          { label: "Affichés", value: page.results.length.toLocaleString("fr-FR") },
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
