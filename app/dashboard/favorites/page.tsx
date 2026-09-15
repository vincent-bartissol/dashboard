import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";
import { listFavorites } from "@/lib/db/queries";
import { DATASETS } from "@/lib/opendata/datasets";
import { requireSession } from "@/lib/session";

const DATASET_HREF: Record<string, string> = {
  [DATASETS.velib.id]: "/dashboard/velib",
  [DATASETS.trees.id]: "/dashboard/nature",
  [DATASETS.parks.id]: "/dashboard/nature?tab=parks",
  [DATASETS.air.id]: "/dashboard/air",
  [DATASETS.fountains.id]: "/dashboard/amenities",
  [DATASETS.toilets.id]: "/dashboard/amenities?tab=toilets",
  [DATASETS.events.id]: "/dashboard/events",
  [DATASETS.works.id]: "/dashboard/traffic",
  [DATASETS.street.id]: "/dashboard/traffic?tab=street",
  [DATASETS.montreuilTrees.id]: "/dashboard/montreuil?tab=trees",
  [DATASETS.montreuilGardens.id]: "/dashboard/montreuil?tab=gardens",
  [DATASETS.montreuilFountains.id]: "/dashboard/montreuil?tab=water",
  [DATASETS.montreuilMist.id]: "/dashboard/montreuil?tab=water",
  [DATASETS.montreuilBikes.id]: "/dashboard/montreuil?tab=bikes",
};

export default async function FavoritesPage() {
  const session = await requireSession();
  const favorites = await listFavorites(session.user.id);

  return (
    <div>
      <PageIntro title="Favoris">
        Points et fiches que vous avez enregistrés depuis les pages thématiques.
      </PageIntro>
      {favorites.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Aucun favori pour le moment. Ouvrez un thème et cliquez sur le cœur.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-heading">{item.label}</p>
                <p className="text-sm text-muted">{item.datasetId}</p>
              </div>
              <Link
                href={DATASET_HREF[item.datasetId] ?? "/dashboard"}
                className="text-sm font-medium text-heading hover:underline"
              >
                Voir le thème
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
