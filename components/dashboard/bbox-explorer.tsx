import { BboxExplorerClient } from "@/components/dashboard/bbox-explorer-client";
import type { DatasetConfig, OpenDataPage } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import type { MapMarker } from "@/lib/opendata/markers";

export async function BboxExplorer({
  dataset,
  ...props
}: {
  dataset: DatasetConfig;
  initial: OpenDataPage;
  favoriteIds: string[];
  colorScheme?: "velib" | "status";
  descriptionKeys?: string[];
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
}) {
  return <BboxExplorerClient dataset={await localizeExplorerDataset(dataset)} {...props} />;
}
