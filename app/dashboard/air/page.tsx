import { AirCharts } from "@/components/dashboard/air-charts";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function AirPage() {
  const session = await requireSession();
  const { page, favoriteIds } = await loadTheme(DATASETS.air, session.user.id);
  const latest = [...page.results].sort((a, b) => String(b.annee).localeCompare(String(a.annee)))[0];

  return (
    <div className="space-y-6">
      <PageIntro title="Qualité de l’air" dataset={DATASETS.air}>
        Nombre de jours par classe d’indice ATMO (Airparif), année par année. Pas de carte dense :
        ce jeu est statistique.
      </PageIntro>
      <KpiStrip
        items={[
          { label: "Dernière année", value: String(latest?.annee ?? "—") },
          { label: "Jours « bonne »", value: Number(latest?.ind_jour_qa_bonne ?? 0) },
          { label: "Jours « moyenne »", value: Number(latest?.ind_jour_qa_moyenne ?? 0) },
          { label: "Jours « mauvaise »", value: Number(latest?.ind_jour_qa_mauvaise ?? 0) },
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
