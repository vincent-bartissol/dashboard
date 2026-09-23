"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, FetchResult, OpenDataPage } from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";
import { BBOX_PAGE_MAX, BBOX_PAGE_SIZE } from "@/lib/opendata/bbox-constants";

export type Bbox = { south: number; west: number; north: number; east: number };

export type BboxRecordsPage = {
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
};

const BBOX_MAP_LIMIT = BBOX_PAGE_MAX;

export async function fetchBboxRecords(
  datasetId: string,
  bbox: Bbox,
  options?: { limit?: number; offset?: number; signal?: AbortSignal },
): Promise<BboxRecordsPage> {
  const params = new URLSearchParams({
    dataset: datasetId,
    south: String(bbox.south),
    west: String(bbox.west),
    north: String(bbox.north),
    east: String(bbox.east),
    limit: String(options?.limit ?? BBOX_PAGE_SIZE),
    offset: String(options?.offset ?? 0),
  });
  const res = await fetch(`/api/opendata/records?${params}`, { signal: options?.signal });
  const data = (await res.json()) as FetchResult & {
    nextOffset?: number;
    hasMore?: boolean;
  };
  if (!res.ok || !data.ok || !Array.isArray(data.page?.results)) {
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
  const t = useTranslations("Explorer");
  const tCommon = useTranslations("Common");
  const [bbox, setBbox] = useState<Bbox | null>(null);
  const timer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const onBbox = useMemo(
    () => (next: Bbox) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setBbox(next);
      }, 400);
    },
    [],
  );

  const markersQuery = useQuery({
    queryKey: ["opendata-records-markers", dataset.id, bbox],
    queryFn: ({ signal }) =>
      fetchBboxRecords(dataset.id, bbox!, { limit: BBOX_MAP_LIMIT, offset: 0, signal }),
    enabled: bbox != null,
    placeholderData: keepPreviousData,
  });

  const tableQuery = useInfiniteQuery({
    queryKey: ["opendata-records-table", dataset.id, bbox],
    queryFn: ({ pageParam, signal }) =>
      fetchBboxRecords(dataset.id, bbox!, {
        limit: BBOX_PAGE_SIZE,
        offset: pageParam,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
    enabled: bbox != null,
    placeholderData: keepPreviousData,
  });

  const mapPage = markersQuery.data?.page ?? initial;
  const tablePages = tableQuery.data?.pages;
  const tableRecords =
    tablePages?.flatMap((entry) => entry.page.results) ??
    (bbox == null ? initial.results : mapPage.results.slice(0, BBOX_PAGE_SIZE));
  const totalCount =
    markersQuery.data?.page.total_count ??
    tablePages?.[0]?.page.total_count ??
    initial.total_count;

  const error =
    markersQuery.error instanceof Error || tableQuery.error instanceof Error
      ? (markersQuery.error instanceof Error ? markersQuery.error.message : null) ===
          "rate_limited" ||
        (tableQuery.error instanceof Error ? tableQuery.error.message : null) ===
          "rate_limited"
        ? "rate_limited"
        : "opendata"
      : null;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = tableQuery;
  const canLoadMore = bbox != null && Boolean(hasNextPage);

  useEffect(() => {
    const root = scrollRef.current;
    const node = sentinel.current;
    if (!root || !node || !canLoadMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { root, rootMargin: "80px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, isFetchingNextPage, fetchNextPage, tableRecords.length]);

  return (
    <div className="space-y-4">
      {error ? (
        <p role="status" className="text-sm text-danger">
          {error === "rate_limited" ? tCommon("rateLimited") : tCommon("opendataDown")}
        </p>
      ) : null}
      <ThemeExplorerClient
        dataset={dataset}
        records={tableRecords}
        mapRecords={mapPage.results}
        totalCount={totalCount}
        favoriteIds={favoriteIds}
        colorScheme={colorScheme}
        descriptionKeys={descriptionKeys}
        onBbox={onBbox}
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        extraMarkers={extraMarkers}
        paginate={false}
        tableMaxHeight="28rem"
        tableScrollRef={scrollRef}
        tableEnd={
          <div
            ref={sentinel}
            className="border-t border-line px-4 py-3 text-center text-sm text-muted"
            aria-live="polite"
          >
            {isFetchingNextPage
              ? t("loadingMore")
              : canLoadMore
                ? t("loadMoreHint")
                : null}
          </div>
        }
      />
    </div>
  );
}
