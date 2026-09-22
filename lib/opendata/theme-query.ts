import type { FetchResult, OpenDataPage } from "@/lib/opendata/client";

export const themeQueryKey = (datasetId: string, district?: string | null) =>
  ["opendata-theme", datasetId, district ?? "profile"] as const;

export async function fetchThemePage(
  datasetId: string,
  options?: { district?: string | null; signal?: AbortSignal },
): Promise<OpenDataPage> {
  const params = new URLSearchParams({ dataset: datasetId });
  if (options?.district != null && options.district !== "") {
    params.set("district", options.district);
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
