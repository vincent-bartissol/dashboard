"use client";

import { useMemo, useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { extractGeo, recordId, recordLabel, type OpenDataRecord } from "@/lib/opendata/client";
import type { ExplorerDataset } from "@/lib/opendata/client";
import { DynamicParisMap } from "@/components/map/dynamic-map";
import { recordsToMarkers } from "@/lib/opendata/markers";
import { recordMatchesQuery } from "@/lib/opendata/search";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MapMarker } from "@/lib/opendata/markers";

type ColorScheme = "velib" | "status";

const PAGE_SIZE = 50;

type Props = {
  dataset: ExplorerDataset;
  records: OpenDataRecord[];
  totalCount: number;
  favoriteIds: string[];
  colorScheme?: ColorScheme;
  descriptionKeys?: string[];
  onBbox?: (bbox: { south: number; west: number; north: number; east: number }) => void;
  mapCenter?: { lat: number; lon: number };
  mapZoom?: number;
  extraMarkers?: MapMarker[];
};

function colorFor(scheme: ColorScheme | undefined, record: OpenDataRecord) {
  if (scheme === "velib") {
    const bikes = Number(record.numbikesavailable ?? 0);
    if (bikes <= 0) return "#c8102e";
    if (bikes < 5) return "#fd7e14";
    return "#2f9e44";
  }
  if (scheme === "status") {
    const value = String(record.dispo ?? record.statut ?? "").toLowerCase();
    if (value.includes("non") || value.includes("hors")) return "#c8102e";
    return "#2f9e44";
  }
  return undefined;
}

function describe(record: OpenDataRecord, keys?: string[]) {
  if (!keys?.length) return undefined;
  return keys
    .map((key) => record[key])
    .filter((value) => value != null && value !== "")
    .join(" · ");
}

export function ThemeExplorerClient({
  dataset,
  records,
  totalCount,
  favoriteIds,
  colorScheme,
  descriptionKeys,
  onBbox,
  mapCenter,
  mapZoom,
  extraMarkers = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [favorites, setFavorites] = useState(new Set(favoriteIds));
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () => records.filter((record) => recordMatchesQuery(record, dataset.columns, query)),
    [dataset.columns, query, records],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  const markers = useMemo(
    () =>
      dataset.geoField
        ? recordsToMarkers(filtered, {
            idField: dataset.idField,
            titleField: dataset.titleField,
            geoField: dataset.geoField,
            color: (record) => colorFor(colorScheme, record) ?? "#12263a",
            description: (record) => describe(record, descriptionKeys) ?? "",
          })
        : [],
    [colorScheme, dataset, descriptionKeys, filtered],
  );

  function onToggle(record: OpenDataRecord) {
    const id = recordId(record, dataset.idField);
    if (!id) return;
    const previous = new Set(favorites);
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
    const geo = dataset.geoField ? extractGeo(record, dataset.geoField) : null;
    startTransition(() => {
      void toggleFavorite({
        datasetId: dataset.id,
        recordId: id,
        label: recordLabel(record, dataset.titleField),
        geo: geo ? JSON.stringify(geo) : null,
      }).then((result) => {
        if (!result.ok) setFavorites(previous);
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPageIndex(0);
          }}
          placeholder="Filtrer le tableau et la carte…"
          className="max-w-md"
        />
        <p className="text-sm text-muted">
          {filtered.length.toLocaleString("fr-FR")} filtrés / {totalCount.toLocaleString("fr-FR")} au
          total
        </p>
      </div>
      {dataset.geoField ? (
        <DynamicParisMap
          markers={[...markers, ...extraMarkers]}
          onBounds={dataset.bbox ? onBbox : undefined}
          center={mapCenter}
          zoom={mapZoom}
        />
      ) : null}
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-ground text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-12 px-3 py-2" />
              {dataset.columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((record, index) => {
              const id = recordId(record, dataset.idField) || String(index);
              const saved = favorites.has(id);
              return (
                <tr key={`${id}::${index}`} className="border-b border-line/80 last:border-0">
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onToggle(record)}
                      className="rounded-none p-1 text-muted hover:text-accent"
                      aria-label={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
                    </button>
                  </td>
                  {dataset.columns.map((column) => (
                    <td key={column.key} className="max-w-xs truncate px-3 py-1.5">
                      {formatCell(record[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-sm text-muted">
            Page {currentPage + 1} / {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              disabled={currentPage === 0}
              onClick={() => setPageIndex(currentPage - 1)}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPageIndex(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
