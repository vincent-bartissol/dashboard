"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import {
  bboxWhere,
  joinWhere,
  opendataQueryErrorKind,
  type DatasetConfig,
  type ExplorerDataset,
  type OpenDataPage,
  type OpenDataRecord,
} from "@/lib/opendata/client";
import { fetchRecordsBrowser } from "@/lib/opendata/browser-fetch";
import { DATASETS, PARIS_BBOX } from "@/lib/opendata/datasets";
import type { MapMarker } from "@/lib/opendata/markers";
import { BBOX_PAGE_SIZE } from "@/lib/opendata/bbox-constants";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { markerSelect } from "@/lib/opendata/theme-api";

export type Bbox = { south: number; west: number; north: number; east: number };

export type BboxRecordsPage = {
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
};

function bboxKey(bbox: Bbox) {
  return `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
}

function bboxTableEndLabel(
  t: (key: "loadingMore" | "loadMoreHint") => string,
  params: {
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    hasTableData: boolean;
    bboxActive: boolean;
    isFetching: boolean;
  },
) {
  if (params.isFetchingNextPage || (params.bboxActive && params.isFetching && !params.hasTableData)) {
    return t("loadingMore");
  }
  if (params.hasNextPage && params.hasTableData) return t("loadMoreHint");
  return null;
}

function datasetConfig(datasetId: string): DatasetConfig | undefined {
  return Object.values(DATASETS).find((dataset) => dataset.id === datasetId) as
    | DatasetConfig
    | undefined;
}

export async function fetchBboxRecords(
  datasetId: string,
  bbox: Bbox,
  options?: { limit?: number; offset?: number; signal?: AbortSignal },
): Promise<BboxRecordsPage> {
  const config = datasetConfig(datasetId);
  if (!config?.geoField) throw new Error("opendata");
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? BBOX_PAGE_SIZE;
  const where = joinWhere(config.defaultWhere, bboxWhere(config.geoField, bbox));
  const data = await fetchRecordsBrowser(datasetId, {
    limit,
    offset,
    where,
    orderBy: themeOrderBy(config),
    host: config.host,
    signal: options?.signal,
  });
  if (!data.ok || !Array.isArray(data.page?.results)) {
    throw new Error(data.error === "rate_limited" ? "rate_limited" : "opendata");
  }
  const nextOffset = offset + data.page.results.length;
  return {
    page: data.page,
    nextOffset,
    hasMore: nextOffset < data.page.total_count,
  };
}

export async function fetchBboxMarkers(
  datasetId: string,
  bbox: Bbox,
  signal?: AbortSignal,
): Promise<OpenDataPage> {
  const config = datasetConfig(datasetId);
  if (!config?.geoField) throw new Error("opendata");
  const where = joinWhere(config.defaultWhere, bboxWhere(config.geoField, bbox));
  const data = await fetchRecordsBrowser(datasetId, {
    limit: 100,
    where,
    select: markerSelect(config),
    host: config.host,
    signal,
  });
  if (!data.ok || !Array.isArray(data.page?.results)) {
    throw new Error(data.error === "rate_limited" ? "rate_limited" : "opendata");
  }
  return data.page;
}

function useInfiniteTableScroll(options: {
  scrollRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  isFetching: boolean;
  ready: boolean;
  dep: number;
}) {
  const {
    scrollRef,
    sentinelRef,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    ready,
    dep,
  } = options;

  useEffect(() => {
    const root = scrollRef.current;
    const node = sentinelRef.current;
    if (!root || !node || !hasNextPage || !ready || isFetching) return;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, ready, isFetching, dep, scrollRef, sentinelRef]);
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
}: Readonly<{
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  mapRecords?: OpenDataRecord[];
  favoriteIds: string[];
  colorScheme?: "velib" | "status";
  descriptionKeys?: string[];
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
}>) {
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
    // Do not keep previous pages across bbox changes — offsets belong to the old viewport.
    staleTime: bbox == null ? Infinity : 0,
  });

  const mapRecords = markersQuery.data?.results ?? seedMap;
  const tableRecords =
    tableQuery.data?.pages.flatMap((entry) => entry.page.results) ??
    (bbox == null ? initial.results : []);
  const totalCount =
    markersQuery.data?.total_count ??
    tableQuery.data?.pages[0]?.page.total_count ??
    initial.total_count;

  const error = opendataQueryErrorKind(markersQuery.error, tableQuery.error);

  const { hasNextPage, isFetchingNextPage, fetchNextPage, isFetching } = tableQuery;

  useInfiniteTableScroll({
    scrollRef,
    sentinelRef: sentinel,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    ready: Boolean(tableQuery.data),
    dep: tableRecords.length,
  });

  return (
    <div className="space-y-4">
      {error ? (
        <output className="block text-sm text-danger" aria-live="polite">
          {error === "rate_limited" ? tCommon("rateLimited") : tCommon("opendataDown")}
        </output>
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
            {bboxTableEndLabel(t, {
              isFetchingNextPage,
              hasNextPage,
              hasTableData: Boolean(tableQuery.data),
              bboxActive: bbox != null,
              isFetching,
            })}
          </div>
        }
      />
    </div>
  );
}
