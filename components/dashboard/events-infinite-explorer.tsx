"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import { Button } from "@/components/ui/button";
import type { ExplorerDataset, FetchResult, OpenDataPage } from "@/lib/opendata/client";

type EventsPage = {
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
};

async function fetchEventsPage(offset: number, signal?: AbortSignal): Promise<EventsPage> {
  const res = await fetch(`/api/opendata/events?offset=${offset}`, { signal });
  const data = (await res.json()) as FetchResult & {
    nextOffset?: number;
    hasMore?: boolean;
  };
  if (!res.ok || !data.ok || !data.page) {
    throw new Error(res.status === 429 ? "rate_limited" : "opendata");
  }
  return {
    page: data.page,
    nextOffset: data.nextOffset ?? offset + data.page.results.length,
    hasMore: Boolean(data.hasMore),
  };
}

export function EventsInfiniteExplorer({
  dataset,
  initial,
  favoriteIds,
  initialError,
}: {
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  favoriteIds: string[];
  initialError?: string | null;
}) {
  const t = useTranslations("Pages.events");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const sentinel = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["opendata-events"],
    queryFn: ({ pageParam, signal }) => fetchEventsPage(pageParam, signal),
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

  const records = query.data?.pages.flatMap((entry) => entry.page.results) ?? initial.results;
  const totalCount = query.data?.pages[0]?.page.total_count ?? initial.total_count;
  const liveError =
    query.error instanceof Error
      ? query.error.message === "rate_limited"
        ? "rate_limited"
        : "opendata"
      : null;

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [query]);

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
      <KpiStrip
        items={[
          {
            label: t("events"),
            value: liveError || initialError ? "—" : format.number(totalCount),
          },
          {
            label: t("shown"),
            value: liveError || initialError ? "—" : format.number(records.length),
          },
        ]}
      />
      <ThemeExplorerClient
        dataset={dataset}
        records={records}
        totalCount={totalCount}
        favoriteIds={favoriteIds}
        descriptionKeys={["lead_text", "address_name"]}
      />
      <div ref={sentinel} className="flex justify-center py-2">
        {query.hasNextPage ? (
          <Button
            type="button"
            variant="secondary"
            disabled={query.isFetchingNextPage}
            onClick={() => void query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? t("loadingMore") : t("loadMore")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
