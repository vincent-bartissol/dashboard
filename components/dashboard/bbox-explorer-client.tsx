"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, FetchResult, OpenDataPage } from "@/lib/opendata/client";

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
  const t = useTranslations("Common");
  const [page, setPage] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestId = useRef(0);

  const onBbox = useMemo(
    () => (bbox: { south: number; west: number; north: number; east: number }) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const id = (requestId.current += 1);
        const params = new URLSearchParams({
          dataset: dataset.id,
          south: String(bbox.south),
          west: String(bbox.west),
          north: String(bbox.north),
          east: String(bbox.east),
        });
        void fetch(`/api/opendata/records?${params}`, { signal: controller.signal })
          .then(async (res) => {
            const data = (await res.json()) as FetchResult;
            if (id !== requestId.current) return;
            if (!res.ok || !data.ok || !Array.isArray(data.page?.results)) {
              setError(data.error ?? "opendata");
              return;
            }
            setError(null);
            setPage(data.page);
          })
          .catch((cause: unknown) => {
            if (cause instanceof DOMException && cause.name === "AbortError") return;
            if (id !== requestId.current) return;
            setError("opendata");
          });
      }, 400);
    },
    [dataset.id],
  );

  return (
    <div className="space-y-4">
      {error ? (
        <p role="status" className="text-sm text-danger">
          {t("opendataDown")}
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
