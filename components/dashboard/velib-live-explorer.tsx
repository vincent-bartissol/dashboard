"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import type { ExplorerDataset, OpenDataPage, OpenDataRecord } from "@/lib/opendata/client";
import { fetchThemeMarkers, themeMarkersQueryKey } from "@/lib/opendata/theme-query";

export function VelibLiveExplorer({
  dataset,
  initial,
  mapRecords: initialMapRecords,
  favoriteIds,
  initialError,
}: {
  dataset: ExplorerDataset;
  initial: OpenDataPage;
  mapRecords: OpenDataRecord[];
  favoriteIds: string[];
  initialError?: string | null;
}) {
  const t = useTranslations("Pages.velib");
  const format = useFormatter();

  const markersQuery = useQuery({
    queryKey: themeMarkersQueryKey(dataset.id),
    queryFn: ({ signal }) => fetchThemeMarkers(dataset.id, { signal }),
    initialData: { total_count: initial.total_count, results: initialMapRecords },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const mapRecords = markersQuery.data?.results ?? initialMapRecords;
  const total = markersQuery.data?.total_count ?? initial.total_count;
  const showDown = Boolean(initialError || markersQuery.isError);
  const bikes = mapRecords.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0);
  const docks = mapRecords.reduce((sum, row) => sum + Number(row.numdocksavailable ?? 0), 0);
  const ebikes = mapRecords.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);
  const kpi = (value: number) => (showDown ? "—" : format.number(value));

  return (
    <InfiniteThemeExplorer
      dataset={dataset}
      initial={initial}
      mapRecords={initialMapRecords}
      favoriteIds={favoriteIds}
      initialError={initialError}
      colorScheme="velib"
      descriptionKeys={["numbikesavailable", "numdocksavailable"]}
      refetchInterval={60_000}
    >
      <KpiStrip
        items={[
          { label: t("stations"), value: kpi(total) },
          { label: t("bikes"), value: kpi(bikes) },
          { label: t("ebikes"), value: kpi(ebikes) },
          { label: t("docks"), value: kpi(docks) },
        ]}
      />
    </InfiniteThemeExplorer>
  );
}
