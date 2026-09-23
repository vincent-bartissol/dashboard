"use client";

import { useFormatter, useTranslations } from "next-intl";
import { InfiniteThemeExplorer } from "@/components/dashboard/infinite-theme-explorer";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import type { ExplorerDataset, OpenDataPage, OpenDataRecord } from "@/lib/opendata/client";

export function VelibLiveExplorer({
  dataset,
  initial,
  mapRecords,
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

  return (
    <InfiniteThemeExplorer
      dataset={dataset}
      initial={initial}
      mapRecords={mapRecords}
      favoriteIds={favoriteIds}
      initialError={initialError}
      colorScheme="velib"
      descriptionKeys={["numbikesavailable", "numdocksavailable"]}
      refetchInterval={60_000}
    >
      {({ mapRecords: liveMarkers, totalCount }) => {
        const showDown = Boolean(initialError);
        const bikes = liveMarkers.reduce(
          (sum, row) => sum + Number(row.numbikesavailable ?? 0),
          0,
        );
        const docks = liveMarkers.reduce(
          (sum, row) => sum + Number(row.numdocksavailable ?? 0),
          0,
        );
        const ebikes = liveMarkers.reduce((sum, row) => sum + Number(row.ebike ?? 0), 0);
        const kpi = (value: number) => (showDown ? "—" : format.number(value));
        return (
          <KpiStrip
            items={[
              { label: t("stations"), value: kpi(totalCount) },
              { label: t("bikes"), value: kpi(bikes) },
              { label: t("ebikes"), value: kpi(ebikes) },
              { label: t("docks"), value: kpi(docks) },
            ]}
          />
        );
      }}
    </InfiniteThemeExplorer>
  );
}
