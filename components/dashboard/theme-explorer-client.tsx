"use client";

import { useId, useMemo, useState, type ReactNode, type RefObject } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Bell, Heart } from "lucide-react";
import {
  extractGeo,
  recordId,
  recordLabel,
  type ExplorerDataset,
  type OpenDataRecord,
} from "@/lib/opendata/client";
import { scalarString } from "@/lib/safe-string";
import { DynamicParisMap } from "@/components/map/dynamic-map";
import { recordsToMarkers } from "@/lib/opendata/markers";
import { recordMatchesQuery } from "@/lib/opendata/search";
import { compareCellValues, columnAriaSort, type SortDir } from "@/lib/opendata/sort";
import { SortColumnChevron } from "@/components/dashboard/sort-column-chevron";
import { useFavoritesQuery, useToggleFavoriteMutation } from "@/lib/favorites-query";
import type { FavoriteDto } from "@/lib/favorites";
import { DATASETS } from "@/lib/opendata/datasets";
import { CompareDistrictPanel } from "@/components/dashboard/compare-district-panel";
import { useNotify } from "@/components/dashboard/notifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  /** Full geo set for the map; defaults to `records` when omitted. */
  mapRecords?: OpenDataRecord[];
  /** Show a map skeleton while markers load client-side. */
  mapLoading?: boolean;
  /** Map markers are a viewport/sample subset — prefer table row count in the filter label. */
  mapSample?: boolean;
  /** When false, show every loaded row (for server-side infinite scroll). Default true. */
  paginate?: boolean;
  /** Cap table body height and scroll inside the card. */
  tableMaxHeight?: string;
  /** Content after rows, inside the scroll container (e.g. load-more sentinel). */
  tableEnd?: ReactNode;
  /** Optional ref to the table scroll container (for IntersectionObserver root). */
  tableScrollRef?: RefObject<HTMLDivElement | null>;
};

function colorFor(scheme: ColorScheme | undefined, record: OpenDataRecord) {
  if (scheme === "velib") {
    const bikes = Number(record.numbikesavailable ?? 0);
    if (bikes <= 0) return "#c8102e";
    if (bikes < 5) return "#fd7e14";
    return "#2f9e44";
  }
  if (scheme === "status") {
    const value = scalarString(record.dispo ?? record.statut).toLowerCase();
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

function ExplorerMap(
  props: Readonly<{
    hasGeoField: boolean;
    mapLoading: boolean;
    loadingLabel: string;
    markers: MapMarker[];
    onBounds?: (bbox: { south: number; west: number; north: number; east: number }) => void;
    center?: { lat: number; lon: number };
    zoom?: number;
  }>,
) {
  if (!props.hasGeoField) return null;
  if (props.mapLoading) {
    return (
      <div
        className="surface-panel flex h-[420px] items-center justify-center text-sm text-muted"
        role="status"
        aria-live="polite"
      >
        {props.loadingLabel}
      </div>
    );
  }
  return (
    <DynamicParisMap
      markers={props.markers}
      onBounds={props.onBounds}
      center={props.center}
      zoom={props.zoom}
    />
  );
}

function seedFavorites(datasetId: string, favoriteIds: string[]): FavoriteDto[] {
  return favoriteIds.map((id) => ({
    id: `seed-${id}`,
    datasetId,
    recordId: id,
    label: id,
    geo: null,
  }));
}

function ThemeExplorerTable(props: Readonly<{
  dataset: ExplorerDataset;
  pageRows: OpenDataRecord[];
  canAlert: boolean;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (columnKey: string) => void;
  favorites: Set<string>;
  onToggle: (record: OpenDataRecord) => void;
  onAlert: (record: OpenDataRecord) => void;
  t: ReturnType<typeof useTranslations<"Explorer">>;
  tableMaxHeight?: string;
  tableScrollRef?: RefObject<HTMLDivElement | null>;
  tableEnd?: ReactNode;
  paginate: boolean;
  pageCount: number;
  currentPage: number;
  setPageIndex: (index: number) => void;
}>) {
  const {
    dataset,
    pageRows,
    canAlert,
    sortKey,
    sortDir,
    onSort,
    favorites,
    onToggle,
    onAlert,
    t,
    tableMaxHeight,
    tableScrollRef,
    tableEnd,
    paginate,
    pageCount,
    currentPage,
    setPageIndex,
  } = props;

  return (
    <Card className="p-0">
      <div
        ref={tableScrollRef}
        className={tableMaxHeight ? "overflow-auto" : "overflow-x-auto"}
        style={tableMaxHeight ? { maxHeight: tableMaxHeight } : undefined}
      >
        <table className="min-w-full text-left text-sm">
          <thead className={`table-head ${tableMaxHeight ? "sticky top-0 z-10" : ""}`}>
            <tr>
              <th className="w-12 px-3 py-2">
                <span className="sr-only">{t("favoriteColumn")}</span>
              </th>
              {canAlert ? (
                <th className="w-12 px-3 py-2">
                  <span className="sr-only">{t("alertColumn")}</span>
                </th>
              ) : null}
              {dataset.columns.map((column) => {
                const active = sortKey === column.key;
                const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <th
                    key={column.key}
                    className="px-3 py-2"
                    aria-sort={columnAriaSort(active, sortDir)}
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
                      <SortColumnChevron active={active} sortDir={sortDir} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={dataset.columns.length + 1 + (canAlert ? 1 : 0)}
                  className="px-3 py-6 text-center text-muted"
                >
                  {t("noMatches")}
                </td>
              </tr>
            ) : null}
            {pageRows.map((record, index) => {
              const id = recordId(record, dataset.idField) || String(index);
              const saved = favorites.has(id);
              return (
                <tr key={`${id}::${index}`} className="table-row">
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onToggle(record)}
                      className="focus-field rounded-none p-1 text-muted hover:text-accent"
                      aria-label={saved ? t("removeFavorite") : t("addFavorite")}
                    >
                      <Heart className={`h-4 w-4 ${saved ? "fill-accent text-accent" : ""}`} />
                    </button>
                  </td>
                  {canAlert ? (
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onAlert(record);
                        }}
                        className="focus-field rounded-none p-1 text-muted hover:text-heading"
                        aria-label={t("addAlert", { n: 3 })}
                      >
                        <Bell className="h-4 w-4" aria-hidden />
                      </button>
                    </td>
                  ) : null}
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
        {tableEnd}
      </div>
      {paginate ? (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
          <p className="text-sm text-muted">
            {t("page", { current: currentPage + 1, count: pageCount })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              disabled={currentPage === 0}
              onClick={() => setPageIndex(currentPage - 1)}
            >
              {t("previous")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPageIndex(currentPage + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
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
  mapRecords,
  mapLoading = false,
  mapSample = false,
  paginate = true,
  tableMaxHeight,
  tableEnd,
  tableScrollRef,
}: Readonly<Props>) {
  const t = useTranslations("Explorer");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const filterId = useId();
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const notify = useNotify();
  const favoritesQuery = useFavoritesQuery(seedFavorites(dataset.id, favoriteIds));
  const toggleFavorite = useToggleFavoriteMutation();
  const canAlert = dataset.id === DATASETS.velib.id;

  const favorites = useMemo(() => {
    const rows = favoritesQuery.data ?? [];
    return new Set(
      rows.filter((row) => row.datasetId === dataset.id).map((row) => row.recordId),
    );
  }, [dataset.id, favoritesQuery.data]);

  const filtered = useMemo(
    () => records.filter((record) => recordMatchesQuery(record, dataset.columns, query)),
    [dataset.columns, query, records],
  );

  const filteredMap = useMemo(
    () =>
      mapRecords
        ? mapRecords.filter((record) => recordMatchesQuery(record, dataset.columns, query))
        : filtered,
    [dataset.columns, filtered, mapRecords, query],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) =>
      compareCellValues(a[sortKey], b[sortKey], sortDir),
    );
  }, [filtered, sortDir, sortKey]);

  const pageCount = paginate ? Math.max(1, Math.ceil(sorted.length / PAGE_SIZE)) : 1;
  const currentPage = paginate ? Math.min(pageIndex, pageCount - 1) : 0;
  const pageRows = paginate
    ? sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE)
    : sorted;

  const markers = useMemo(
    () =>
      dataset.geoField
        ? recordsToMarkers(filteredMap, {
            idField: dataset.idField,
            titleField: dataset.titleField,
            geoField: dataset.geoField,
            color: (record) => colorFor(colorScheme, record) ?? "#12263a",
            description: (record) => describe(record, descriptionKeys) ?? "",
          })
        : [],
    [colorScheme, dataset, descriptionKeys, filteredMap],
  );

  const filteredCount =
    mapRecords != null && !mapSample ? filteredMap.length : filtered.length;


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
    const wasSaved = favorites.has(id);
    const geo = dataset.geoField ? extractGeo(record, dataset.geoField) : null;
    toggleFavorite.mutate(
      {
        datasetId: dataset.id,
        recordId: id,
        label: recordLabel(record, dataset.titleField, t("untitled")),
        geo: geo ? JSON.stringify(geo) : null,
      },
      {
        onError: (error) => {
          notify({
            tone: "danger",
            message:
              error instanceof Error && error.message === "favoriteLimit"
                ? t("favoriteLimit")
                : t("favoriteError"),
          });
        },
        onSuccess: () => {
          notify({
            tone: "status",
            message: wasSaved ? t("favoriteRemoved") : t("favoriteAdded"),
          });
        },
      },
    );
  }

  async function onAlert(record: OpenDataRecord) {
    const id = recordId(record, dataset.idField);
    if (!id) return;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        datasetId: dataset.id,
        recordId: id,
        label: recordLabel(record, dataset.titleField, t("untitled")),
        threshold: 3,
      }),
    });
    if (!res.ok) {
      let error: "alertLimit" | "alertRateLimited" | "alertError" = "alertError";
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error === "limit") error = "alertLimit";
        else if (res.status === 429 || data.error === "rate_limited") error = "alertRateLimited";
      } catch {
        // keep generic alertError
      }
      notify({ tone: "danger", message: t(error) });
      return;
    }
    notify({ tone: "status", message: t("alertCreated") });
  }

  return (
    <div className="space-y-4">
      {!dataset.bbox ? (
        <CompareDistrictPanel datasetId={dataset.id} primaryCount={totalCount} />
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          id={filterId}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPageIndex(0);
          }}
          placeholder={paginate ? t("filterPlaceholder") : t("filterLoadedPlaceholder")}
          aria-label={paginate ? t("filterPlaceholder") : t("filterLoadedPlaceholder")}
          className="max-w-md"
        />
        <p className="text-sm text-muted">
          {t("filtered", {
            filtered: format.number(filteredCount),
            total: format.number(totalCount),
          })}
        </p>
      </div>
      {!paginate && query.trim() ? (
        <p className="text-xs text-muted">{t("filterLoadedHint")}</p>
      ) : null}
      <ExplorerMap
        hasGeoField={Boolean(dataset.geoField)}
        mapLoading={mapLoading}
        loadingLabel={tCommon("mapLoading")}
        markers={[...markers, ...extraMarkers]}
        onBounds={dataset.bbox ? onBbox : undefined}
        center={mapCenter}
        zoom={mapZoom}
      />
      <ThemeExplorerTable
        dataset={dataset}
        pageRows={pageRows}
        canAlert={canAlert}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        favorites={favorites}
        onToggle={onToggle}
        onAlert={onAlert}
        t={t}
        tableMaxHeight={tableMaxHeight}
        tableScrollRef={tableScrollRef}
        tableEnd={tableEnd}
        paginate={paginate}
        pageCount={pageCount}
        currentPage={currentPage}
        setPageIndex={setPageIndex}
      />
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return scalarString(value);
}
