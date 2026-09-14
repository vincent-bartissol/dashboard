export type BBox = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export function parseBbox(searchParams: URLSearchParams): BBox | null {
  const south = Number(searchParams.get("south"));
  const west = Number(searchParams.get("west"));
  const north = Number(searchParams.get("north"));
  const east = Number(searchParams.get("east"));
  if (![south, west, north, east].every(Number.isFinite)) return null;
  return { south, west, north, east };
}

export function clampBbox(bbox: BBox, max: BBox): BBox | null {
  if (bbox.south >= bbox.north || bbox.west >= bbox.east) return null;
  const clamped = {
    south: Math.max(bbox.south, max.south),
    west: Math.max(bbox.west, max.west),
    north: Math.min(bbox.north, max.north),
    east: Math.min(bbox.east, max.east),
  };
  if (clamped.south >= clamped.north || clamped.west >= clamped.east) return null;
  return clamped;
}

export type RecordsQuery =
  | { ok: true; datasetId: string; bbox: BBox }
  | { ok: false; error: string };

export function recordsQueryFromSearch(searchParams: URLSearchParams, max: BBox): RecordsQuery {
  const datasetId = searchParams.get("dataset") ?? "";
  const raw = parseBbox(searchParams);
  if (!raw) {
    return { ok: false, error: "Emprise invalide" };
  }
  const bbox = clampBbox(raw, max);
  if (!bbox) {
    return { ok: false, error: "Emprise invalide" };
  }
  return { ok: true, datasetId, bbox };
}
