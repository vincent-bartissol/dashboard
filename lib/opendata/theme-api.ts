import { getProfile } from "@/lib/db/queries";
import { arrondissementWhere, parsePreferredDistrict } from "@/lib/opendata/arrondissement";
import {
  fetchAllRecords,
  fetchRecordsSafe,
  joinWhere,
  type DatasetConfig,
  type OpenDataPage,
} from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { THEME_PAGE_MAX, THEME_PAGE_SIZE } from "@/lib/opendata/theme-constants";

export { THEME_PAGE_MAX, THEME_PAGE_SIZE } from "@/lib/opendata/theme-constants";

export const THEME_DATASETS = new Map(
  Object.values(DATASETS)
    .filter((dataset) => !dataset.bbox)
    .map((dataset) => [dataset.id, dataset]),
);

export function resolveThemeDataset(datasetId: string | null): DatasetConfig | undefined {
  if (!datasetId) return undefined;
  return THEME_DATASETS.get(datasetId);
}

export type ThemeLoadOptions = {
  district?: string | null;
  ignoreProfile?: boolean;
  limit?: number;
  offset?: number;
  extraWhere?: string;
};

async function resolveDistrictWhere(
  config: DatasetConfig,
  userId: string,
  options?: ThemeLoadOptions,
): Promise<{ ok: true; where?: string } | { ok: false; error: "bad_district" }> {
  let districtCode: string | null | undefined = options?.district;
  if (districtCode === undefined && !options?.ignoreProfile) {
    const profile = await getProfile(userId);
    districtCode = profile.arrondissement;
  }
  if (districtCode != null && districtCode !== "") {
    const parsed = parsePreferredDistrict(districtCode);
    if (!parsed.ok) return { ok: false, error: "bad_district" };
    districtCode = parsed.value;
  } else {
    districtCode = null;
  }
  const district = arrondissementWhere(config, districtCode);
  return {
    ok: true,
    where: joinWhere(district, config.defaultWhere, options?.extraWhere),
  };
}

function clampLimit(value: number | undefined) {
  if (value == null || !Number.isFinite(value)) return THEME_PAGE_SIZE;
  return Math.min(THEME_PAGE_MAX, Math.max(1, Math.floor(value)));
}

function clampOffset(value: number | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export type ThemePageResult = {
  ok: boolean;
  page: OpenDataPage;
  nextOffset: number;
  hasMore: boolean;
  error?: string;
};

/** One table page (default 50 rows). */
export async function loadThemePage(
  config: DatasetConfig,
  userId: string,
  options?: ThemeLoadOptions,
): Promise<ThemePageResult> {
  const resolved = await resolveDistrictWhere(config, userId, options);
  if (!resolved.ok) {
    return {
      ok: false,
      page: { total_count: 0, results: [] },
      nextOffset: 0,
      hasMore: false,
      error: "bad_district",
    };
  }

  const limit = clampLimit(options?.limit);
  const offset = clampOffset(options?.offset);
  const result = await fetchRecordsSafe(
    config.id,
    {
      limit,
      offset,
      where: resolved.where,
      orderBy: themeOrderBy(config),
      host: config.host,
    },
    config.revalidate,
  );
  const loaded = result.page.results.length;
  const nextOffset = offset + loaded;
  return {
    ok: result.ok,
    page: result.page,
    nextOffset,
    hasMore: result.ok && nextOffset < result.page.total_count,
    error: result.ok ? undefined : result.error ?? "opendata",
  };
}

/** Slim fields enough for map markers (+ Vélib’ / status colors). */
export function markerSelect(config: DatasetConfig): string {
  const fields = new Set<string>();
  for (const part of config.idField.split(",")) {
    const trimmed = part.trim();
    if (trimmed && trimmed !== config.geoField) fields.add(trimmed);
  }
  if (config.titleField && config.titleField !== config.geoField) {
    fields.add(config.titleField);
  }
  if (config.geoField) fields.add(config.geoField);
  if (config.id === DATASETS.velib.id) {
    fields.add("numbikesavailable");
    fields.add("numdocksavailable");
    fields.add("ebike");
  }
  for (const key of ["dispo", "statut"] as const) {
    if (config.columns.some((column) => column.key === key)) fields.add(key);
  }
  return [...fields].join(",");
}

export async function loadThemeMarkers(
  config: DatasetConfig,
  userId: string,
  options?: ThemeLoadOptions,
): Promise<{ ok: boolean; page: OpenDataPage; error?: string }> {
  if (!config.geoField) {
    return { ok: true, page: { total_count: 0, results: [] } };
  }
  const resolved = await resolveDistrictWhere(config, userId, options);
  if (!resolved.ok) {
    return { ok: false, page: { total_count: 0, results: [] }, error: "bad_district" };
  }

  const max = config.id === DATASETS.velib.id ? 1600 : 1500;
  const result = await fetchAllRecords(config.id, config.revalidate, {
    where: resolved.where,
    host: config.host,
    max,
    orderBy: themeOrderBy(config),
    select: markerSelect(config),
  });
  return {
    ok: result.ok,
    page: result.page,
    error: result.ok ? undefined : result.error ?? "opendata",
  };
}
