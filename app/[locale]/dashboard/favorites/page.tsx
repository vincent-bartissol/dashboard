import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";
import { listFavorites } from "@/lib/db/queries";
import { DATASETS } from "@/lib/opendata/datasets";
import { localizeDatasetTitleById } from "@/lib/opendata/localize";
import { requireSession } from "@/lib/session";

const DATASET_HREF: Record<string, string> = {
  [DATASETS.velib.id]: "/dashboard/velib",
  [DATASETS.trees.id]: "/dashboard/nature",
  [DATASETS.parks.id]: "/dashboard/nature?tab=parks",
  [DATASETS.air.id]: "/dashboard/air",
  [DATASETS.fountains.id]: "/dashboard/amenities",
  [DATASETS.toilets.id]: "/dashboard/amenities?tab=toilets",
  [DATASETS.events.id]: "/dashboard/events",
  [DATASETS.markets.id]: "/dashboard/markets",
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
  const t = await getTranslations("Pages.favorites");
  const favorites = await listFavorites(session.user.id);
  const datasetTitles = Object.fromEntries(
    await Promise.all(
      [...new Set(favorites.map((item) => item.datasetId))].map(async (datasetId) => [
        datasetId,
        await localizeDatasetTitleById(datasetId),
      ]),
    ),
  );

  return (
    <div>
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
      {favorites.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">{t("empty")}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {favorites.map((item) => (
            <Card key={item.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-heading">{item.label}</p>
                <p className="text-sm text-muted">{datasetTitles[item.datasetId] ?? item.datasetId}</p>
              </div>
              <Link
                href={DATASET_HREF[item.datasetId] ?? "/dashboard"}
                className="text-sm font-medium text-heading hover:underline"
              >
                {t("openTheme")}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
