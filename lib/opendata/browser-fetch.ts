import {
  type FetchResult,
  type OpenDataHost,
  type OpenDataPage,
  type OpenDataRecord,
} from "@/lib/opendata/client";

const HOSTS: Record<OpenDataHost, string> = {
  paris: "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets",
  montreuil: "https://data.montreuil.fr/api/explore/v2.1/catalog/datasets",
};

const MAX_PAGE = 100;
const FETCH_TIMEOUT_MS = 10_000;

export type BrowserRecordsQuery = {
  limit?: number;
  offset?: number;
  where?: string;
  orderBy?: string;
  select?: string;
  host?: OpenDataHost;
  signal?: AbortSignal;
};

function emptyPage<T>(): OpenDataPage<T> {
  return { total_count: 0, results: [] };
}

function buildRecordsUrl(datasetId: string, params: BrowserRecordsQuery) {
  const base = HOSTS[params.host ?? "paris"];
  const url = new URL(`${base}/${encodeURIComponent(datasetId)}/records`);
  url.searchParams.set("limit", String(Math.min(params.limit ?? MAX_PAGE, MAX_PAGE)));
  if (params.offset) url.searchParams.set("offset", String(params.offset));
  if (params.where) url.searchParams.set("where", params.where);
  if (params.orderBy) url.searchParams.set("order_by", params.orderBy);
  if (params.select) url.searchParams.set("select", params.select);
  return url;
}

function withTimeout(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

export async function fetchRecordsBrowser<T = OpenDataRecord>(
  datasetId: string,
  params: BrowserRecordsQuery,
): Promise<FetchResult<T>> {
  try {
    const { signal, ...query } = params;
    const url = buildRecordsUrl(datasetId, query);
    const res = await fetch(url.toString(), { signal: withTimeout(signal) });
    if (res.status === 429) {
      return { ok: false, page: emptyPage<T>(), error: "rate_limited" };
    }
    if (!res.ok) {
      return { ok: false, page: emptyPage<T>(), error: `Open Data ${datasetId}: ${res.status}` };
    }
    const data = (await res.json()) as OpenDataPage<T>;
    if (!data || typeof data !== "object" || !Array.isArray(data.results)) {
      return { ok: false, page: emptyPage<T>(), error: `Open Data ${datasetId}: invalid payload` };
    }
    const total_count = Number(data.total_count);
    if (!Number.isFinite(total_count)) {
      return { ok: false, page: emptyPage<T>(), error: `Open Data ${datasetId}: invalid payload` };
    }
    return { ok: true, page: { total_count, results: data.results } };
  } catch (error) {
    const message = error instanceof Error ? error.message : `Open Data ${datasetId} unavailable`;
    return { ok: false, page: emptyPage<T>(), error: message };
  }
}
