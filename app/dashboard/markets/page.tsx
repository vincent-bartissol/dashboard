import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import { DATASETS } from "@/lib/opendata/datasets";
import { loadTheme } from "@/lib/opendata/load";
import { requireSession } from "@/lib/session";

export default async function MarketsPage() {
  const session = await requireSession();
  const { page, favoriteIds } = await loadTheme(DATASETS.markets, session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title="Marchés découverts" dataset={DATASETS.markets}>
        Emprises des marchés alimentaires et spécialisés, avec jours de tenue et horaires.
      </PageIntro>
      <KpiStrip
        items={[
          { label: "Marchés", value: page.total_count.toLocaleString("fr-FR") },
          {
            label: "Alimentaires",
            value: page.results.filter((row) => String(row.produit).toLowerCase().includes("aliment")).length,
          },
        ]}
      />
      <ThemeExplorer
        dataset={DATASETS.markets}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        descriptionKeys={["jours_tenue", "produit"]}
      />
    </div>
  );
}
