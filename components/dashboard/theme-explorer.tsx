import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import type { DatasetConfig, OpenDataRecord } from "@/lib/opendata/client";
import { localizeExplorerDataset } from "@/lib/opendata/localize";
import type { MapMarker } from "@/lib/opendata/markers";

export async function ThemeExplorer({
  dataset,
  ...props
}: {
  dataset: DatasetConfig;
  records: OpenDataRecord[];
  totalCount: number;
  favoriteIds: string[];
  colorScheme?: "velib" | "status";
  descriptionKeys?: string[];
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
}) {
  return <ThemeExplorerClient dataset={await localizeExplorerDataset(dataset)} {...props} />;
}
