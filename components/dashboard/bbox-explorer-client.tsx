"use client";

import { useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, FetchResult, OpenDataPage } from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";

export type Bbox = { south: number; west: number; north: number; east: number };

export async function fetchBboxRecords(
  datasetId: string,
  bbox: Bbox,
  signal?: AbortSignal,
): Promise<OpenDataPage> {
  const params = new URLSearchParams({
    dataset: datasetId,
    south: String(bbox.south),
    west: String(bbox.west),
    north: String(bbox.north),
    east: String(bbox.east),
  });
  const res = await fetch(`/api/opendata/records?${params}`, { signal });
  const data = (await res.json()) as FetchResult;
  if (!res.ok || !data.ok || !Array.isArray(data.page?.results)) {
    throw new Error(
      res.status === 429 || data.error === "rate_limited" ? "rate_limited" : "opendata",
    );
  }
  return data.page;
}

export function BboxExplorerClient({
  dataset,
  initial,
  favoriteIds,
  colorScheme,
  descriptionKeys,
  mapCenter,
  mapZoom,
  extraMarkers,
}: {
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  favoriteIds: string[];
  colorScheme?: "velib" | "status";
  descriptionKeys?: string[];
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
}) {
  const t = useTranslations("Common");
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const timer = useRef<number | null>(null);

  const onBbox = useMemo(
    () => (next: Bbox) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setBbox(next);
      }, 400);
    },
    [],
  );

  const query = useQuery({
    queryKey: ["opendata-records", dataset.id, bbox],
    queryFn: ({ signal }) => fetchBboxRecords(dataset.id, bbox!, signal),
    enabled: bbox != null,
    placeholderData: keepPreviousData,
  });

  const page = query.data ?? initial;
  const error =
    query.error instanceof Error
      ? query.error.message === "rate_limited"
        ? "rate_limited"
        : "opendata"
      : null;

  return (
    <div className="space-y-4">
      {error ? (
        <p role="status" className="text-sm text-danger">
          {error === "rate_limited" ? t("rateLimited") : t("opendataDown")}
        </p>
      ) : null}
      <ThemeExplorerClient
        dataset={dataset}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        colorScheme={colorScheme}
        descriptionKeys={descriptionKeys}
        onBbox={onBbox}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        extraMarkers={extraMarkers}
      />
    </div>
  );
}
