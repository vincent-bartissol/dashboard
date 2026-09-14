import { getProfile, listFavorites } from "@/lib/db/queries";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import {
  bboxWhere,
  fetchAllRecords,
  fetchRecordsSafe,
  joinWhere,
  type DatasetConfig,
  type OpenDataPage,
} from "@/lib/opendata/client";
import { PARIS_BBOX } from "@/lib/opendata/datasets";

export async function loadTheme(
  dataset: DatasetConfig,
  userId: string,
  extraWhere?: string,
  options?: { ignoreProfile?: boolean },
) {
  const profile = await getProfile(userId);
  const district = options?.ignoreProfile
    ? undefined
    : arrondissementWhere(dataset.id, profile.arrondissement);
  const where = joinWhere(extraWhere, district);
  const result = dataset.bbox
    ? await fetchRecordsSafe(
        dataset.id,
        {
          limit: 100,
          where: joinWhere(where, bboxWhere(dataset.geoField, PARIS_BBOX)),
          host: dataset.host,
        },
        dataset.revalidate,
      )
    : await fetchAllRecords(dataset.id, dataset.revalidate, {
        where,
        host: dataset.host,
        max: dataset.id === "velib-disponibilite-en-temps-reel" ? 1600 : 1500,
        orderBy: dataset.idField !== dataset.geoField ? dataset.idField : undefined,
      });
  const favorites = await listFavorites(userId, dataset.id);
  const page: OpenDataPage = result.page;
  return {
    page,
    ok: result.ok,
    error: result.error,
    favoriteIds: favorites.map((item) => item.recordId),
    arrondissement: profile.arrondissement,
    where,
  };
}
