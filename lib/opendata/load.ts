import { getProfile, listFavorites } from "@/lib/db/queries";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import {
  bboxWhere,
  fetchAllRecords,
  fetchRecordsSafe,
  joinWhere,
  type DatasetConfig,
  type OpenDataRecord,
} from "@/lib/opendata/client";
import { PARIS_BBOX } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { BBOX_MAP_MAX, BBOX_PAGE_SIZE } from "@/lib/opendata/bbox-constants";
import {
  loadThemePage,
  markerSelect,
  THEME_PAGE_SIZE,
  type ThemeLoadOptions,
} from "@/lib/opendata/theme-api";

/** Table page 0 for non-bbox theme explorers. Markers load client-side. */
export async function loadThemeExplorer(
  dataset: DatasetConfig,
  userId: string,
  options?: ThemeLoadOptions,
) {
  const profile = await getProfile(userId);
  let districtFilter: string | undefined;
  if (options?.district !== undefined) {
    districtFilter = arrondissementWhere(
      dataset,
      options.district === "" || options.district === null ? null : options.district,
    );
  } else if (!options?.ignoreProfile) {
    districtFilter = arrondissementWhere(dataset, profile.arrondissement);
  }
  const where = joinWhere(districtFilter, dataset.defaultWhere, options?.extraWhere);
  const loadOpts: ThemeLoadOptions = {
    ...options,
    limit: options?.limit ?? THEME_PAGE_SIZE,
    offset: options?.offset ?? 0,
    whereOverride: where,
  };

  const [table, favorites] = await Promise.all([
    loadThemePage(dataset, userId, loadOpts),
    listFavorites(userId, dataset.id),
  ]);
  return {
    table: table.page,
    markers: { total_count: 0, results: [] as OpenDataRecord[] },
    hasMore: table.hasMore,
    nextOffset: table.nextOffset,
    ok: table.ok,
    error: table.error,
    favoriteIds: favorites.map((item) => item.recordId),
    arrondissement: profile.arrondissement,
    where,
  };
}

/** Ordered table page 0 + denser unordered slim markers for bbox explorers. */
export async function loadBboxExplorer(dataset: DatasetConfig, userId: string) {
  const profile = await getProfile(userId);
  const district = arrondissementWhere(dataset, profile.arrondissement);
  const where = joinWhere(
    district,
    dataset.defaultWhere,
    bboxWhere(dataset.geoField, PARIS_BBOX),
  );

  const [table, markers, favorites] = await Promise.all([
    fetchRecordsSafe(
      dataset.id,
      {
        limit: BBOX_PAGE_SIZE,
        offset: 0,
        where,
        orderBy: themeOrderBy(dataset),
        host: dataset.host,
      },
      dataset.revalidate,
    ),
    fetchAllRecords(dataset.id, dataset.revalidate, {
      where,
      host: dataset.host,
      max: BBOX_MAP_MAX,
      select: markerSelect(dataset),
    }),
    listFavorites(userId, dataset.id),
  ]);

  return {
    table: table.page,
    markers: markers.page,
    ok: table.ok && markers.ok,
    error: table.error || markers.error,
    favoriteIds: favorites.map((item) => item.recordId),
    arrondissement: profile.arrondissement,
    where,
  };
}
