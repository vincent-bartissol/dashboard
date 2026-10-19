import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import { fetchRecordsBrowser } from "@/lib/opendata/browser-fetch";
import {
  joinWhere,
  type DatasetConfig,
  type FetchResult,
  type OpenDataPage,
} from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { THEME_PAGE_SIZE } from "@/lib/opendata/theme-constants";
import { markerSelect, resolveThemeDataset } from "@/lib/opendata/theme-api";

export const themeQueryKey = (datasetId: string, district?: string | null) =>
  ["opendata-theme", datasetId, district ?? "profile"] as const;

export const themeTableQueryKey = (datasetId: string, district?: string | null) =>
  ["opendata-theme-table", datasetId, district ?? "profile"] as const;

export const themeMarkersQueryKey = (datasetId: string, district?: string | null) =>
  ["opendata-theme-markers", datasetId, district ?? "profile"] as const;

export type ThemeTablePage = {
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
};

function resolveConfig(datasetId: string): DatasetConfig | undefined {
  return (
    resolveThemeDataset(datasetId) ??
    (Object.values(DATASETS).find((d) => d.id === datasetId) as DatasetConfig | undefined)
  );
}

function districtWhere(datasetId: string, district?: string | null) {
  const config = resolveConfig(datasetId);
  if (!config) return undefined;
  const districtFilter =
    district != null && district !== "" ? arrondissementWhere(config, district) : undefined;
  return joinWhere(districtFilter, config.defaultWhere);
}

export async function fetchThemeTablePage(
  datasetId: string,
  options?: {
    district?: string | null;
    offset?: number;
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<ThemeTablePage> {
  const config = resolveConfig(datasetId);
  if (!config) throw new Error("opendata");
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? THEME_PAGE_SIZE;
  const result = await fetchRecordsBrowser(datasetId, {
    limit,
    offset,
    where: districtWhere(datasetId, options?.district),
    orderBy: themeOrderBy(config),
    host: config.host,
    signal: options?.signal,
  });
  if (!result.ok || !result.page || !Array.isArray(result.page.results)) {
    throw new Error(result.error === "rate_limited" ? "rate_limited" : "opendata");
  }
  const nextOffset = offset + result.page.results.length;
  return {
    page: result.page,
    nextOffset,
    hasMore: nextOffset < result.page.total_count,
  };
}

/** Full slim marker set (or one table page when used by compare without mode). */
export async function fetchThemePage(
  datasetId: string,
  options?: { district?: string | null; signal?: AbortSignal; mode?: "markers" },
): Promise<OpenDataPage> {
  const config = resolveConfig(datasetId);
  if (!config) throw new Error("opendata");
  if (options?.mode === "markers") {
    const result = await fetchRecordsBrowser(datasetId, {
      limit: 100,
      where: districtWhere(datasetId, options?.district),
      select: markerSelect(config),
      host: config.host,
      signal: options?.signal,
    });
    if (!result.ok || !Array.isArray(result.page?.results)) {
      throw new Error(result.error === "rate_limited" ? "rate_limited" : "opendata");
    }
    return result.page;
  }
  const page = await fetchThemeTablePage(datasetId, {
    district: options?.district,
    signal: options?.signal,
  });
  return page.page;
}

export async function fetchThemeMarkers(
  datasetId: string,
  options?: { district?: string | null; signal?: AbortSignal },
): Promise<OpenDataPage> {
  return fetchThemePage(datasetId, { ...options, mode: "markers" });
}

export type { FetchResult };
