"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { toggleFavorite } from "@/lib/actions/favorites";
import { extractGeo, recordId, recordLabel, type OpenDataRecord } from "@/lib/opendata/client";
import type { ExplorerDataset } from "@/lib/opendata/client";
import { DynamicParisMap } from "@/components/map/dynamic-map";
import { recordsToMarkers } from "@/lib/opendata/markers";
import { recordMatchesQuery } from "@/lib/opendata/search";
import { compareCellValues, type SortDir } from "@/lib/opendata/sort";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MapMarker } from "@/lib/opendata/markers";

type ColorScheme = "velib" | "status";

const PAGE_SIZE = 10;

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
  const t = useTranslations("Explorer");
  const format = useFormatter();
  const filterId = useId();
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [favorites, setFavorites] = useState(new Set(favoriteIds));
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () => records.filter((record) => recordMatchesQuery(record, dataset.columns, query)),
    [dataset.columns, query, records],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) =>
      compareCellValues(a[sortKey], b[sortKey], sortDir),
    );
  }, [filtered, sortDir, sortKey]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

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

  function onSort(columnKey: string) {
    if (sortKey === columnKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(columnKey);
      setSortDir("asc");
    }
    setPageIndex(0);
  }

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
        label: recordLabel(record, dataset.titleField, t("untitled")),
        geo: geo ? JSON.stringify(geo) : null,
      }).then((result) => {
        if (!result.ok) {
          setFavorites(previous);
          setFavoriteError(result.error === "favoriteLimit" ? "favoriteLimit" : "favorite");
          return;
        }
        setFavoriteError(null);
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          id={filterId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPageIndex(0);
          }}
          placeholder={t("filterPlaceholder")}
          aria-label={t("filterPlaceholder")}
          className="max-w-md"
        />
        <p className="text-sm text-muted">
          {t("filtered", {
            filtered: format.number(filtered.length),
            total: format.number(totalCount),
          })}
        </p>
      </div>
      {favoriteError ? (
        <p role="alert" className="text-sm text-danger">
          {favoriteError === "favoriteLimit" ? t("favoriteLimit") : t("favoriteError")}
        </p>
      ) : null}
      {dataset.geoField ? (
        <DynamicParisMap
          markers={[...markers, ...extraMarkers]}
          onBounds={dataset.bbox ? onBbox : undefined}
          center={mapCenter}
          zoom={mapZoom}
        />
      ) : null}
      <Card className="overflow-x-auto p-0">
        <Table>
          <TableHeader className="bg-ground">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <span className="sr-only">{t("favoriteColumn")}</span>
              </TableHead>
              {dataset.columns.map((column) => {
                const active = sortKey === column.key;
                const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <TableHead
                    key={column.key}
                    aria-sort={
                      active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1 focus-field hover:text-heading"
                      aria-label={
                        nextDir === "asc"
                          ? t("sortAsc", { column: column.label })
                          : t("sortDesc", { column: column.label })
                      }
                    >
                      {column.label}
                      {active ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                        )
                      ) : null}
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={dataset.columns.length + 1}
                  className="px-3 py-6 text-center text-muted"
                >
                  {t("noMatches")}
                </TableCell>
              </TableRow>
            ) : null}
            {pageRows.map((record, index) => {
              const id = recordId(record, dataset.idField) || String(index);
              const saved = favorites.has(id);
              return (
                <TableRow key={`${id}::${index}`}>
                  <TableCell className="px-2">
                    <button
                      type="button"
                      onClick={() => onToggle(record)}
                      className="focus-field rounded-none p-1 text-muted hover:text-accent"
                      aria-label={saved ? t("removeFavorite") : t("addFavorite")}
                    >
                      <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
                    </button>
                  </TableCell>
                  {dataset.columns.map((column) => (
                    <TableCell key={column.key} className="max-w-xs truncate">
                      {formatCell(record[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-sm text-muted">
            {t("page", { current: currentPage + 1, count: pageCount })}
          </p>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text={t("previous")}
                  disabled={currentPage === 0}
                  onClick={() => setPageIndex(currentPage - 1)}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text={t("next")}
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => setPageIndex(currentPage + 1)}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
