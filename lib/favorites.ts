export type FavoriteDto = {
  id: string;
  datasetId: string;
  recordId: string;
  label: string;
  geo: string | null;
};

export function toFavoriteDtos(
  rows: { id: string; datasetId: string; recordId: string; label: string; geo: string | null }[],
): FavoriteDto[] {
  return rows.map((row) => ({
    id: row.id,
    datasetId: row.datasetId,
    recordId: row.recordId,
    label: row.label,
    geo: row.geo,
  }));
}
