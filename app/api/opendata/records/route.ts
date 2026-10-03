import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getProfile } from "@/lib/db/queries";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import { recordsQueryFromSearch } from "@/lib/opendata/bbox";
import {
  bboxWhere,
  fetchAllRecords,
  fetchRecordsSafe,
  joinWhere,
  type DatasetConfig,
} from "@/lib/opendata/client";
import { DATASETS, PARIS_BBOX } from "@/lib/opendata/datasets";
import { BBOX_MAP_MAX, BBOX_PAGE_MAX, BBOX_PAGE_SIZE } from "@/lib/opendata/bbox-constants";
import { logOpendataFailure } from "@/lib/opendata/log-failure";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { clampLimitParam, clampOffsetParam } from "@/lib/opendata/page-clamp";
import { markerSelect } from "@/lib/opendata/theme-api";
import { opendataRecordsLimit } from "@/lib/rate-limit";

const ALLOWED = new Map(
  Object.values(DATASETS)
    .filter((dataset) => dataset.bbox)
    .map((dataset) => [dataset.id, dataset]),
);

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(opendataRecordsLimit);
  if (!auth.ok) return auth.response;

  const query = recordsQueryFromSearch(request.nextUrl.searchParams, PARIS_BBOX);
  if (!query.ok) {
    return NextResponse.json({ ok: false, error: query.error }, { status: 400 });
  }

  const config = ALLOWED.get(query.datasetId) as DatasetConfig | undefined;
  if (!config?.geoField) {
    return NextResponse.json({ ok: false, error: "unknown_dataset" }, { status: 400 });
  }

  const profile = await getProfile(auth.session.user.id);
  const district = arrondissementWhere(config, profile.arrondissement);
  const where = joinWhere(district, bboxWhere(config.geoField, query.bbox));

  if (request.nextUrl.searchParams.get("mode") === "markers") {
    const result = await fetchAllRecords(config.id, config.revalidate, {
      where,
      host: config.host,
      max: BBOX_MAP_MAX,
      select: markerSelect(config),
      // No orderBy: better spatial spread for map samples than id-sorted clusters.
    });
    if (!result.ok) {
      logOpendataFailure("records/markers", result.error);
      return NextResponse.json(
        { ok: false, error: "opendata", page: result.page },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, page: result.page });
  }

  const limit = clampLimitParam(request.nextUrl.searchParams.get("limit"), {
    size: BBOX_PAGE_SIZE,
    max: BBOX_PAGE_MAX,
  });
  const offset = clampOffsetParam(request.nextUrl.searchParams.get("offset"));

  const result = await fetchRecordsSafe(
    config.id,
    {
      limit,
      offset,
      where,
      orderBy: themeOrderBy(config),
      host: config.host,
    },
    config.revalidate,
  );
  if (!result.ok) {
    logOpendataFailure("records/page", result.error);
    return NextResponse.json(
      { ok: false, error: "opendata", page: result.page },
      { status: 502 },
    );
  }
  const nextOffset = offset + result.page.results.length;
  return NextResponse.json({
    ok: true,
    page: result.page,
    nextOffset,
    hasMore: nextOffset < result.page.total_count,
  });
}
