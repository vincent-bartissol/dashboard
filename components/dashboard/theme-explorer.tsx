import { ThemeExplorerClient } from "@/components/dashboard/theme-explorer-client";
import { toExplorerDataset, type DatasetConfig, type OpenDataRecord } from "@/lib/opendata/client";
import type { MapMarker } from "@/lib/opendata/markers";

export function ThemeExplorer({
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
  return <ThemeExplorerClient dataset={toExplorerDataset(dataset)} {...props} />;
}
