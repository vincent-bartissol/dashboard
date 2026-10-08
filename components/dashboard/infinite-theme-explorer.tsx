"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import {
  opendataQueryErrorKind,
  type ExplorerDataset,
  type OpenDataPage,
  type OpenDataRecord,
} from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";
import {
  fetchThemeMarkers,
  fetchThemeTablePage,
  themeMarkersQueryKey,
  themeTableQueryKey,
} from "@/lib/opendata/theme-query";

export type InfiniteThemeSlot = {
  mapRecords: OpenDataRecord[];
  totalCount: number;
};

function infiniteTableEndLabel(
  t: (key: "loadingMore" | "loadMoreHint") => string,
  isFetchingNextPage: boolean,
  hasNextPage: boolean,
) {
  if (isFetchingNextPage) return t("loadingMore");
  if (hasNextPage) return t("loadMoreHint");
  return null;
}

function infiniteExplorerErrorMessage(
  liveError: ReturnType<typeof opendataQueryErrorKind>,
  initialError: string | null | undefined,
  tCommon: (key: "rateLimited" | "opendataDown") => string,
) {
  if (liveError === "rate_limited") return tCommon("rateLimited");
  if (liveError === "opendata") return tCommon("opendataDown");
  if (initialError) return tCommon("opendataDown");
  return null;
}

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
}: Readonly<{
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
  children?: ReactNode | ((slot: InfiniteThemeSlot) => ReactNode);
}>) {
  const t = useTranslations("Explorer");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const skipTableReset = useRef(true);

  const markersQuery = useQuery({
    queryKey: themeMarkersQueryKey(dataset.id, district),
    queryFn: ({ signal }) => fetchThemeMarkers(dataset.id, { district, signal }),
    enabled: Boolean(dataset.geoField),
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
    // Refresh only page 0 in place — drop deeper pages so live data stays coherent
    // without refetching every scrolled page.
    void (async () => {
      try {
        const page0 = await fetchThemeTablePage(dataset.id, { district, offset: 0 });
        queryClient.setQueryData(themeTableQueryKey(dataset.id, district), {
          pages: [page0],
          pageParams: [0],
        });
      } catch {
        // Live poll failures are surfaced via markersQuery / next user scroll.
      }
    })();
  }, [dataset.id, district, markersQuery.dataUpdatedAt, queryClient, refetchInterval]);

  const records =
    tableQuery.data?.pages.flatMap((entry) => entry.page.results) ?? initial.results;
  const tableTotal =
    tableQuery.data?.pages[0]?.page.total_count ?? initial.total_count;
  // No-geo datasets (e.g. air) intentionally return empty markers with total_count 0 —
  // always prefer the table total in that case.
  const totalCount = dataset.geoField
    ? (markersQuery.data?.total_count ?? tableTotal)
    : tableTotal;
  const mapRecords = markersQuery.data?.results ?? initialMapRecords;
  const mapLoading = Boolean(dataset.geoField) && markersQuery.isPending;

  const liveError = opendataQueryErrorKind(tableQuery.error, markersQuery.error);
  const errorMessage = infiniteExplorerErrorMessage(liveError, initialError, tCommon);

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

  const slot: InfiniteThemeSlot = { mapRecords, totalCount };
  const childNode = typeof children === "function" ? children(slot) : children;

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <p role="status" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
      {childNode}
      <ThemeExplorerClient
        dataset={dataset}
        records={records}
        mapRecords={dataset.geoField ? mapRecords : undefined}
        mapLoading={mapLoading}
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
            {infiniteTableEndLabel(t, isFetchingNextPage, hasNextPage)}
          </div>
        }
      />
    </div>
  );
}
