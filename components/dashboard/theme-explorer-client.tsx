"use client";

import { useId, useMemo, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Bell, Heart } from "lucide-react";
import { extractGeo, recordId, recordLabel, type OpenDataRecord } from "@/lib/opendata/client";
import type { ExplorerDataset } from "@/lib/opendata/client";
import { DynamicParisMap } from "@/components/map/dynamic-map";
import { recordsToMarkers } from "@/lib/opendata/markers";
import { recordMatchesQuery } from "@/lib/opendata/search";
import { compareCellValues, type SortDir } from "@/lib/opendata/sort";
import { useFavoritesQuery, useToggleFavoriteMutation } from "@/lib/favorites-query";
import type { FavoriteDto } from "@/lib/favorites";
import { DATASETS } from "@/lib/opendata/datasets";
import { CompareDistrictPanel } from "@/components/dashboard/compare-district-panel";
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

function seedFavorites(datasetId: string, favoriteIds: string[]): FavoriteDto[] {
  return favoriteIds.map((id) => ({
    id: `seed-${id}`,
    datasetId,
    recordId: id,
    label: id,
    geo: null,
  }));
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
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

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
          setFavoriteError(
            error instanceof Error && error.message === "favoriteLimit"
              ? "favoriteLimit"
              : "favorite",
          );
        },
        onSuccess: () => setFavoriteError(null),
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
      setAlertMessage(null);
      return;
    }
    setAlertMessage(t("alertCreated"));
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
      {alertMessage ? (
        <p role="status" className="text-sm text-muted">
          {alertMessage}
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
        <table className="min-w-full text-left text-sm">
          <thead className="text-label border-b border-line bg-ground">
            <tr>
              <th className="w-12 px-3 py-2">
                <span className="sr-only">{t("favoriteColumn")}</span>
              </th>
              {canAlert ? <th className="w-12 px-3 py-2" /> : null}
              {dataset.columns.map((column) => {
                const active = sortKey === column.key;
                const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";
                return (
                  <th
                    key={column.key}
                    className="px-3 py-2"
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
                <tr key={`${id}::${index}`} className="border-b border-line/80 last:border-0">
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
                        onClick={() => void onAlert(record)}
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
      </Card>
    </div>
  );
}

function formatCell(value: unknown) {
  if (value == null || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
