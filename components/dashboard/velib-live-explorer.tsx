"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { ExplorerDataset, OpenDataPage } from "@/lib/opendata/client";
import { fetchThemePage, themeQueryKey } from "@/lib/opendata/theme-query";

export function VelibLiveExplorer({
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
  const t = useTranslations("Pages.velib");
  const tCommon = useTranslations("Common");
  const format = useFormatter();

  const query = useQuery({
    queryKey: themeQueryKey(dataset.id),
    queryFn: ({ signal }) => fetchThemePage(dataset.id, { signal }),
    initialData: initial,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const page = query.data ?? initial;
  const liveError =
    query.error instanceof Error
      ? query.error.message === "rate_limited"
        ? "rate_limited"
        : "opendata"
      : null;
  const showDown = Boolean(liveError || initialError);
  const ok = !showDown;
  const bikes = page.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const docks = page.results.reduce((sum, row) => sum + Number(row.numdocksavailable ?? 0), 0);
  const ebikes = page.results.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);
  const kpi = (value: number) => (ok ? format.number(value) : "—");

  return (
    <div className="space-y-6">
      {showDown ? (
        <p role="status" className="text-sm text-danger">
          {liveError === "rate_limited" ? tCommon("rateLimited") : tCommon("opendataDown")}
        </p>
      ) : null}
      <KpiStrip
        items={[
          { label: t("stations"), value: kpi(page.total_count) },
          { label: t("bikes"), value: kpi(bikes) },
          { label: t("ebikes"), value: kpi(ebikes) },
          { label: t("docks"), value: kpi(docks) },
        ]}
      />
      <ThemeExplorerClient
        dataset={dataset}
        records={page.results}
        totalCount={page.total_count}
        favoriteIds={favoriteIds}
        colorScheme="velib"
        descriptionKeys={["numbikesavailable", "numdocksavailable"]}
      />
    </div>
  );
}
