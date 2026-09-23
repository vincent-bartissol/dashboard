import type { FetchResult, OpenDataPage } from "@/lib/opendata/client";
import { THEME_PAGE_SIZE } from "@/lib/opendata/theme-constants";

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

export async function fetchThemeTablePage(
  datasetId: string,
  options?: {
    district?: string | null;
    offset?: number;
    limit?: number;
    signal?: AbortSignal;
  },
): Promise<ThemeTablePage> {
  const params = new URLSearchParams({
    dataset: datasetId,
    offset: String(options?.offset ?? 0),
    limit: String(options?.limit ?? THEME_PAGE_SIZE),
  });
  if (options?.district != null && options.district !== "") {
    params.set("district", options.district);
  }
  const res = await fetch(`/api/opendata/theme?${params}`, { signal: options?.signal });
  const data = (await res.json()) as FetchResult & {
    nextOffset?: number;
    hasMore?: boolean;
  };
  if (!res.ok || !data.ok || !data.page || !Array.isArray(data.page.results)) {
    throw new Error(
      res.status === 429 || data.error === "rate_limited" ? "rate_limited" : "opendata",
    );
  }
  return {
    page: data.page,
    nextOffset: data.nextOffset ?? (options?.offset ?? 0) + data.page.results.length,
    hasMore: Boolean(data.hasMore),
  };
}

/** Full slim marker set (or one table page when used by compare without mode). */
export async function fetchThemePage(
  datasetId: string,
  options?: { district?: string | null; signal?: AbortSignal; mode?: "markers" },
): Promise<OpenDataPage> {
  const params = new URLSearchParams({ dataset: datasetId });
  if (options?.district != null && options.district !== "") {
    params.set("district", options.district);
  }
  if (options?.mode === "markers") {
    params.set("mode", "markers");
  } else {
    // Compare / prefetch: one page is enough for total_count; markers for full geo
    params.set("limit", String(THEME_PAGE_SIZE));
    params.set("offset", "0");
  }
  const res = await fetch(`/api/opendata/theme?${params}`, { signal: options?.signal });
  const data = (await res.json()) as FetchResult;
  if (!res.ok || !data.ok || !Array.isArray(data.page?.results)) {
    throw new Error(
      res.status === 429 || data.error === "rate_limited" ? "rate_limited" : "opendata",
    );
  }
  return data.page;
}

export async function fetchThemeMarkers(
  datasetId: string,
  options?: { district?: string | null; signal?: AbortSignal },
): Promise<OpenDataPage> {
  return fetchThemePage(datasetId, { ...options, mode: "markers" });
}
