import { DATASETS } from "@/lib/opendata/datasets";

const DATASET_IDS = new Set(Object.values(DATASETS).map((dataset) => dataset.id));

export const MAX_FAVORITE_RECORD_ID = 200;
export const MAX_FAVORITE_LABEL = 200;
export const MAX_FAVORITE_GEO = 400;
export const FAVORITE_MAX = 100;

export function isAtFavoriteLimit(count: number) {
  return count >= FAVORITE_MAX;
}

export type FavoriteInput = {
  datasetId: string;
  recordId: string;
  label: string;
  geo?: string | null;
};

export type ParsedFavorite =
  | { ok: true; datasetId: string; recordId: string; label: string; geo: string | null }
  | { ok: false };

export function parseFavoriteInput(input: FavoriteInput): ParsedFavorite {
  const datasetId = input.datasetId.trim();
  const recordId = input.recordId.trim();
  const label = input.label.trim();
  if (!DATASET_IDS.has(datasetId)) return { ok: false };
  if (!recordId || recordId.length > MAX_FAVORITE_RECORD_ID) return { ok: false };
  if (!label || label.length > MAX_FAVORITE_LABEL) return { ok: false };
  let geo = input.geo ?? null;
  if (geo != null) {
    const trimmed = geo.trim();
    if (trimmed.length > MAX_FAVORITE_GEO) return { ok: false };
    geo = trimmed === "" ? null : trimmed;
  }
  return { ok: true, datasetId, recordId, label, geo };
}
