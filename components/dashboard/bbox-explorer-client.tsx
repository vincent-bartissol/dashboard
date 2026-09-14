"use client";

import { useMemo, useRef, useState } from "react";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, OpenDataPage } from "@/lib/opendata/client";

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
  extraMarkers?: import("@/lib/opendata/markers").MapMarker[];
}) {
  const [page, setPage] = useState(initial);
  const timer = useRef<number | null>(null);

  const onBbox = useMemo(
    () => (bbox: { south: number; west: number; north: number; east: number }) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        const params = new URLSearchParams({
          dataset: dataset.id,
          south: String(bbox.south),
          west: String(bbox.west),
          north: String(bbox.north),
          east: String(bbox.east),
        });
        void fetch(`/api/opendata/records?${params}`)
          .then((res) => res.json())
          .then((data: OpenDataPage) => {
            if (Array.isArray(data.results)) setPage(data);
          });
      }, 400);
    },
    [dataset.id],
  );

  return (
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
  );
}
