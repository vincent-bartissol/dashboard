export type GeoPoint = { lat: number; lon: number };

export type OpenDataRecord = Record<string, unknown>;

export type OpenDataPage<T = OpenDataRecord> = {
  total_count: number;
  results: T[];
};

export type FetchResult<T = OpenDataRecord> = {
  ok: boolean;
  page: OpenDataPage<T>;
  error?: string;
};

export type CountResult = {
  ok: boolean;
  count: number; 
  error?: string; 
 
};

export function formatCount(
  result: CountResult,
  formatNumber: (value: number) => string,
  fallback = "—",
) {
  return result.ok ? formatNumber(result.count) : fallback;
}

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
  defaultWhere?: string;
  district?: {
    paris?: (ctx: {
      code: string;
      zip: string;
      ordinal: string;
      n: number;
    }) => string | undefined;
    montreuil?: string;
  };
};

/** Serializable subset of DatasetConfig safe to pass into Client Components. */
export type ExplorerDataset = Pick<
  DatasetConfig,
  "id" | "title" | "sourceUrl" | "geoField" | "idField" | "titleField" | "bbox" | "columns"
>;

export function toExplorerDataset(dataset: DatasetConfig): ExplorerDataset {
  return {
    id: dataset.id,
    title: dataset.title,
    sourceUrl: dataset.sourceUrl,
    geoField: dataset.geoField,
    idField: dataset.idField,
    titleField: dataset.titleField,
    bbox: dataset.bbox,
    columns: dataset.columns,
  };
}

const HOSTS: Record<OpenDataHost, string> = {
  paris: "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets",
  montreuil: "https://data.montreuil.fr/api/explore/v2.1/catalog/datasets",
};

const MAX_PAGE = 100;
const PAGE_CONCURRENCY = 4;

function emptyPage<T>(): OpenDataPage<T> {
  return { total_count: 0, results: [] };
}

function buildRecordsUrl(
  datasetId: string,
  params: {
    limit?: number;
    offset?: number;
    where?: string;
    orderBy?: string;
    refine?: string;
    select?: string;
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
  if (params.select) url.searchParams.set("select", params.select);
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
    select?: string;
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
    select?: string;
    host?: OpenDataHost;
  },
  revalidate: number,
): Promise<FetchResult<T>> {
  try {
    const page = await fetchRecords<T>(datasetId, params, revalidate);
    return { ok: true, page };
  } catch (error) {
    const message = error instanceof Error ? error.message : `Open Data ${datasetId} indisponible`;
    console.error(message);
    return { ok: false, page: emptyPage<T>(), error: message };
  }
}

export async function fetchCount(
  datasetId: string,
  revalidate: number,
  where?: string,
  host?: OpenDataHost,
): Promise<CountResult> {
  const result = await fetchRecordsSafe(datasetId, { limit: 0, where, host }, revalidate);
  if (!result.ok) {
    return { ok: false, count: 0, error: result.error };
  }
  return { ok: true, count: result.page.total_count };
}

export async function fetchAggregate<T = OpenDataRecord>(
  datasetId: string,
  select: string,
  revalidate: number,
  options?: { where?: string; host?: OpenDataHost },
): Promise<FetchResult<T>> {
  return fetchRecordsSafe<T>(
    datasetId,
    { limit: 1, select, where: options?.where, host: options?.host },
    revalidate,
  );
}

async function mapPool<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index] as T);
    }
  }
  const size = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}

export async function fetchAllRecords<T = OpenDataRecord>(
  datasetId: string,
  revalidate: number,
  options?: { where?: string; orderBy?: string; max?: number; host?: OpenDataHost },
): Promise<FetchResult<T>> {
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
  if (!first.ok) return first;
  const target = Math.min(first.page.total_count, max);
  const extraPages = Math.ceil(Math.max(target - MAX_PAGE, 0) / MAX_PAGE);
  const rest = await mapPool(
    Array.from({ length: extraPages }, (_, index) => index),
    PAGE_CONCURRENCY,
    (index) =>
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
  );
  const failed = rest.find((page) => !page.ok);
  if (failed) {
    return {
      ok: false,
      error: failed.error,
      page: {
        total_count: first.page.total_count,
        results: [...first.page.results, ...rest.flatMap((page) => (page.ok ? page.page.results : []))].slice(
          0,
          max,
        ),
      },
    };
  }
  return {
    ok: true,
    page: {
      total_count: first.page.total_count,
      results: [...first.page.results, ...rest.flatMap((page) => page.page.results)].slice(0, max),
    },
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
  if (idField.includes(",")) {
    return idField
      .split(",")
      .map((key) => {
        const value = record[key.trim()];
        if (value == null || value === "") return "";
        if (typeof value === "object") return "";
        return String(value);
      })
      .join("::");
  }
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
