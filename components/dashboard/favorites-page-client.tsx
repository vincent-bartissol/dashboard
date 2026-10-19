"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { useFavoritesQuery } from "@/lib/favorites-query";
import { DATASETS } from "@/lib/opendata/datasets";

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

export function FavoritesPageClient() {
  const t = useTranslations("Pages.favorites");
  const nav = useTranslations("Nav");
  const favorites = useFavoritesQuery([]);

  if ((favorites.data?.length ?? 0) === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">{t("empty")}</p>
        <Link
          href="/dashboard"
          className="mt-3 inline-block text-sm font-medium text-heading underline focus-field"
        >
          {nav("overview")}
        </Link>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {favorites.data?.map((item) => (
        <li key={item.id}>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-heading">{item.label}</p>
              <p className="text-xs text-muted">{item.datasetId}</p>
            </div>
            <Link
              href={DATASET_HREF[item.datasetId] ?? "/dashboard"}
              className="text-sm font-medium text-heading underline focus-field"
            >
              {t("openTheme")}
            </Link>
          </Card>
        </li>
      ))}
    </ul>
  );
}
