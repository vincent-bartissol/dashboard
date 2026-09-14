import { BboxExplorerClient } from "@/components/dashboard/bbox-explorer-client";
import { toExplorerDataset, type DatasetConfig, type OpenDataPage } from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";

export function BboxExplorer({
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
  return <BboxExplorerClient dataset={toExplorerDataset(dataset)} {...props} />;
}
