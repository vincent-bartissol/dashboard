"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, FetchResult, OpenDataPage, OpenDataRecord } from "@/lib/opendata/client";
import { PARIS_BBOX } from "@/lib/opendata/datasets";
import type { MapMarker } from "@/lib/opendata/markers";
import { BBOX_PAGE_SIZE } from "@/lib/opendata/bbox-constants";

export type Bbox = { south: number; west: number; north: number; east: number };

export type BboxRecordsPage = {
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
};

function bboxKey(bbox: Bbox) {
  return `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
}

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

export async function fetchBboxMarkers(
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
    mode: "markers",
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
  mapRecords: initialMapRecords,
  favoriteIds,
  colorScheme,
  descriptionKeys,
  mapCenter,
  mapZoom,
  extraMarkers,
}: {
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  mapRecords?: OpenDataRecord[];
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

  const seedMap = initialMapRecords ?? initial.results;
  const activeBbox = bbox ?? PARIS_BBOX;
  const activeKey = bboxKey(activeBbox);
  const markersQueryKey = ["opendata-records-markers", dataset.id, activeKey] as const;
  const tableQueryKey = ["opendata-records-table", dataset.id, activeKey] as const;

  const onBbox = useMemo(
    () => (next: Bbox) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setBbox(next);
      }, 400);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const markersQuery = useQuery({
    queryKey: markersQueryKey,
    queryFn: ({ signal }) => fetchBboxMarkers(dataset.id, activeBbox, signal),
    initialData: bbox == null ? { total_count: initial.total_count, results: seedMap } : undefined,
    placeholderData: keepPreviousData,
    staleTime: bbox == null ? Infinity : 0,
  });

  const tableQuery = useInfiniteQuery({
    queryKey: tableQueryKey,
    queryFn: ({ pageParam, signal }) =>
      fetchBboxRecords(dataset.id, activeBbox, {
        limit: BBOX_PAGE_SIZE,
        offset: pageParam,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
    initialData:
      bbox == null
        ? {
            pages: [
              {
                page: initial,
                nextOffset: initial.results.length,
                hasMore: initial.results.length < initial.total_count,
              },
            ],
            pageParams: [0],
          }
        : undefined,
    placeholderData: keepPreviousData,
    staleTime: bbox == null ? Infinity : 0,
  });

  const mapRecords = markersQuery.data?.results ?? seedMap;
  const tableRecords =
    tableQuery.data?.pages.flatMap((entry) => entry.page.results) ?? initial.results;
  const totalCount =
    markersQuery.data?.total_count ??
    tableQuery.data?.pages[0]?.page.total_count ??
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

  useEffect(() => {
    const root = scrollRef.current;
    const node = sentinel.current;
    if (!root || !node || !hasNextPage) return;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, tableRecords.length]);

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
        mapRecords={mapRecords}
        mapSample
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
              : hasNextPage
                ? t("loadMoreHint")
                : null}
          </div>
        }
      />
    </div>
  );
}
