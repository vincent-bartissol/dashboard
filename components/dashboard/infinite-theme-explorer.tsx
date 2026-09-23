"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, OpenDataPage, OpenDataRecord } from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";
import {
  fetchThemeMarkers,
  fetchThemeTablePage,
  themeMarkersQueryKey,
  themeTableQueryKey,
} from "@/lib/opendata/theme-query";

export function InfiniteThemeExplorer({
  dataset,
  initial,
  mapRecords: initialMapRecords,
  favoriteIds,
  initialError,
  district,
  colorScheme,
  descriptionKeys,
  mapCenter,
  mapZoom,
  extraMarkers,
  refetchInterval,
  children,
}: {
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  mapRecords: OpenDataRecord[];
  favoriteIds: string[];
  initialError?: string | null;
  /** Override profile district (e.g. Montreuil tab). */
  district?: string | null;
  colorScheme?: "velib" | "status";
  descriptionKeys?: string[];
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
  refetchInterval?: number;
  children?: ReactNode;
}) {
  const t = useTranslations("Explorer");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const skipTableReset = useRef(true);

  const markersQuery = useQuery({
    queryKey: themeMarkersQueryKey(dataset.id, district),
    queryFn: ({ signal }) => fetchThemeMarkers(dataset.id, { district, signal }),
    initialData: { total_count: initial.total_count, results: initialMapRecords },
    staleTime: refetchInterval ? 30_000 : 60_000,
    refetchInterval,
  });

  const tableQuery = useInfiniteQuery({
    queryKey: themeTableQueryKey(dataset.id, district),
    queryFn: ({ pageParam, signal }) =>
      fetchThemeTablePage(dataset.id, { district, offset: pageParam, signal }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
    initialData: {
      pages: [
        {
          page: initial,
          nextOffset: initial.results.length,
          hasMore: initial.results.length < initial.total_count,
        },
      ],
      pageParams: [0],
    },
  });

  useEffect(() => {
    if (!refetchInterval) return;
    if (skipTableReset.current) {
      skipTableReset.current = false;
      return;
    }
    void queryClient.resetQueries({ queryKey: themeTableQueryKey(dataset.id, district) });
  }, [dataset.id, district, markersQuery.dataUpdatedAt, queryClient, refetchInterval]);

  const records =
    tableQuery.data?.pages.flatMap((entry) => entry.page.results) ?? initial.results;
  const totalCount =
    markersQuery.data?.total_count ??
    tableQuery.data?.pages[0]?.page.total_count ??
    initial.total_count;
  const mapRecords = markersQuery.data?.results ?? initialMapRecords;

  const liveError =
    tableQuery.error instanceof Error || markersQuery.error instanceof Error
      ? (tableQuery.error instanceof Error ? tableQuery.error.message : null) ===
          "rate_limited" ||
        (markersQuery.error instanceof Error ? markersQuery.error.message : null) ===
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, records.length]);

  return (
    <div className="space-y-6">
      {liveError ? (
        <p role="status" className="text-sm text-danger">
          {liveError === "rate_limited" ? tCommon("rateLimited") : tCommon("opendataDown")}
        </p>
      ) : initialError ? (
        <p role="status" className="text-sm text-danger">
          {tCommon("opendataDown")}
        </p>
      ) : null}
      {children}
      <ThemeExplorerClient
        dataset={dataset}
        records={records}
        mapRecords={mapRecords}
        totalCount={totalCount}
        favoriteIds={favoriteIds}
        colorScheme={colorScheme}
        descriptionKeys={descriptionKeys}
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
