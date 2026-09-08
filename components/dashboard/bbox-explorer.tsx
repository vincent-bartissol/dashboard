"use client";

import { useMemo, useRef, useState } from "react";
import { ThemeExplorer } from "@/components/dashboard/theme-explorer";
import type { DatasetConfig, OpenDataPage } from "@/lib/opendata/client";

export function BboxExplorer({
  dataset,
  initial,
  favoriteIds,
  extraWhere,
  colorScheme,
  descriptionKeys,
  mapCenter,
  mapZoom,
  extraMarkers,
}: {
  dataset: DatasetConfig;
  initial: OpenDataPage;
  favoriteIds: string[];
  extraWhere?: string;
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
        if (extraWhere) params.set("where", extraWhere);
        void fetch(`/api/opendata/records?${params}`)
          .then((res) => res.json())
          .then((data: OpenDataPage) => {
            if (Array.isArray(data.results)) setPage(data);
          });
      }, 400);
    },
    [dataset.id, extraWhere],
  );

  return (
    <ThemeExplorer
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
