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

export const THEME_DATASETS = new Map(
  Object.values(DATASETS)
    .filter((dataset) => !dataset.bbox)
    .map((dataset) => [dataset.id, dataset]),
);

export function resolveThemeDataset(datasetId: string | null): DatasetConfig | undefined {
  if (!datasetId) return undefined;
  return THEME_DATASETS.get(datasetId);
}

export async function loadThemePage(
  config: DatasetConfig,
  userId: string,
  options?: { district?: string | null; ignoreProfile?: boolean },
): Promise<{ ok: boolean; page: OpenDataPage; error?: string }> {
  let districtCode: string | null | undefined = options?.district;
  if (districtCode === undefined && !options?.ignoreProfile) {
    const profile = await getProfile(userId);
    districtCode = profile.arrondissement;
  }
  if (districtCode != null && districtCode !== "") {
    const parsed = parsePreferredDistrict(districtCode);
    if (!parsed.ok) {
      return { ok: false, page: { total_count: 0, results: [] }, error: "bad_district" };
    }
    districtCode = parsed.value;
  } else {
    districtCode = null;
  }

  const district = arrondissementWhere(config, districtCode);
  const where = joinWhere(district, config.defaultWhere);
  const result =
    config.bbox
      ? await fetchRecordsSafe(
          config.id,
          { limit: 100, where, host: config.host },
          config.revalidate,
        )
      : await fetchAllRecords(config.id, config.revalidate, {
          where,
          host: config.host,
          max: config.id === "velib-disponibilite-en-temps-reel" ? 1600 : 1500,
          orderBy: themeOrderBy(config),
        });
  return {
    ok: result.ok,
    page: result.page,
    error: result.ok ? undefined : result.error ?? "opendata",
  };
}
