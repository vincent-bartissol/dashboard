import { DATASETS } from "@/lib/opendata/datasets";

/** Nav href → theme dataset ids safe to prefetch (non-bbox). */
export const NAV_PREFETCH_DATASETS: Record<string, string[]> = {
  "/dashboard/velib": [DATASETS.velib.id],
  "/dashboard/events": [DATASETS.events.id],
  "/dashboard/markets": [DATASETS.markets.id],
  "/dashboard/amenities": [DATASETS.fountains.id, DATASETS.toilets.id],
  "/dashboard/air": [DATASETS.air.id],
};
