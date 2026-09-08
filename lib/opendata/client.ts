export type GeoPoint = { lat: number; lon: number };

export type OpenDataRecord = Record<string, unknown>;

export type OpenDataPage<T = OpenDataRecord> = {
  total_count: number;
  results: T[];
};

export type OpenDataHost = "paris" | "montreuil";

export type DatasetConfig = {
  id: string;
  title: string;
  sourceUrl: string;
  revalidate: number;
  geoField: string;
  idField: string;
  titleField: string;
  bbox: boolean;
  columns: { key: string; label: string }[];
  host?: OpenDataHost;
};

const HOSTS: Record<OpenDataHost, string> = {
  paris: "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets",
  montreuil: "https://data.montreuil.fr/api/explore/v2.1/catalog/datasets",
};

const MAX_PAGE = 100;

function buildRecordsUrl(
  datasetId: string,
  params: {
    limit?: number;
    offset?: number;
    where?: string;
    orderBy?: string;
    refine?: string;
    host?: OpenDataHost;
  },
) {
  const base = HOSTS[params.host ?? "paris"];
  const url = new URL(`${base}/${encodeURIComponent(datasetId)}/records`);
  url.searchParams.set("limit", String(Math.min(params.limit ?? MAX_PAGE, MAX_PAGE)));
  if (params.offset) url.searchParams.set("offset", String(params.offset));
  if (params.where) url.searchParams.set("where", params.where);
  if (params.orderBy) url.searchParams.set("order_by", params.orderBy);
  if (params.refine) url.searchParams.set("refine", params.refine);
  return url;
}

export async function fetchRecords<T = OpenDataRecord>(
  datasetId: string,
  params: {
    limit?: number;
    offset?: number;
    where?: string;
    orderBy?: string;
    refine?: string;
    host?: OpenDataHost;
  },
  revalidate: number,
): Promise<OpenDataPage<T>> {
  const url = buildRecordsUrl(datasetId, params);
  const res = await fetch(url, {
    next: { revalidate, tags: [`opendata:${datasetId}`] },
  });
  if (!res.ok) {
    throw new Error(`Open Data ${datasetId}: ${res.status}`);
  }
  return (await res.json()) as OpenDataPage<T>;
}

export async function fetchRecordsSafe<T = OpenDataRecord>(
  datasetId: string,
  params: {
    limit?: number;
    offset?: number;
    where?: string;
    orderBy?: string;
    refine?: string;
    host?: OpenDataHost;
  },
  revalidate: number,
): Promise<OpenDataPage<T>> {
  try {
    return await fetchRecords<T>(datasetId, params, revalidate);
  } catch {
    return { total_count: 0, results: [] };
  }
}

export async function fetchCount(
  datasetId: string,
  revalidate: number,
  where?: string,
  host?: OpenDataHost,
): Promise<number> {
  const page = await fetchRecordsSafe(datasetId, { limit: 0, where, host }, revalidate);
  return page.total_count;
}

export async function fetchAllRecords<T = OpenDataRecord>(
  datasetId: string,
  revalidate: number,
  options?: { where?: string; orderBy?: string; max?: number; host?: OpenDataHost },
): Promise<OpenDataPage<T>> {
  const max = options?.max ?? 2500;
  const first = await fetchRecordsSafe<T>(
    datasetId,
    {
      limit: MAX_PAGE,
      offset: 0,
      where: options?.where,
      orderBy: options?.orderBy,
      host: options?.host,
    },
    revalidate,
  );
  const target = Math.min(first.total_count, max);
  const extraPages = Math.ceil(Math.max(target - MAX_PAGE, 0) / MAX_PAGE);
  const rest = await Promise.all(
    Array.from({ length: extraPages }, (_, index) =>
      fetchRecordsSafe<T>(
        datasetId,
        {
          limit: MAX_PAGE,
          offset: (index + 1) * MAX_PAGE,
          where: options?.where,
          orderBy: options?.orderBy,
          host: options?.host,
        },
        revalidate,
      ),
    ),
  );
  return {
    total_count: first.total_count,
    results: [...first.results, ...rest.flatMap((page) => page.results)].slice(0, max),
  };
}

export function joinWhere(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" AND ") || undefined;
}

export function bboxWhere(
  geoField: string,
  bbox: { south: number; west: number; north: number; east: number },
) {
  return `in_bbox(${geoField},${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
}

export function extractGeo(record: OpenDataRecord, geoField: string): GeoPoint | null {
  const value = record[geoField];
  if (!value || typeof value !== "object") return null;
  const point = value as { lat?: unknown; lon?: unknown; lng?: unknown };
  const lat = Number(point.lat);
  const lon = Number(point.lon ?? point.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

export function recordId(record: OpenDataRecord, idField: string) {
  const value = record[idField];
  if (value == null) return "";
  if (typeof value === "object") {
    const point = value as { lat?: unknown; lon?: unknown };
    if (Number.isFinite(Number(point.lat)) && Number.isFinite(Number(point.lon))) {
      return `${point.lat},${point.lon}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function recordLabel(record: OpenDataRecord, titleField: string) {
  const value = record[titleField];
  return value == null || value === "" ? "Sans nom" : String(value);
}
