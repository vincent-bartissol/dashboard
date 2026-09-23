import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/db/queries";
import { isBannedUser } from "@/lib/admin";
import { getSession } from "@/lib/session";
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
import { themeOrderBy } from "@/lib/opendata/order-by";
import { markerSelect } from "@/lib/opendata/theme-api";
import { opendataRecordsLimit } from "@/lib/rate-limit";

const ALLOWED = new Map(
  Object.values(DATASETS)
    .filter((dataset) => dataset.bbox)
    .map((dataset) => [dataset.id, dataset]),
);

function clampLimit(raw: string | null) {
  const value = Number(raw ?? BBOX_PAGE_SIZE);
  if (!Number.isFinite(value)) return BBOX_PAGE_SIZE;
  return Math.min(BBOX_PAGE_MAX, Math.max(1, Math.floor(value)));
}

function clampOffset(raw: string | null) {
  const value = Number(raw ?? 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limited = opendataRecordsLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const query = recordsQueryFromSearch(request.nextUrl.searchParams, PARIS_BBOX);
  if (!query.ok) {
    return NextResponse.json({ ok: false, error: query.error }, { status: 400 });
  }

  const config = ALLOWED.get(query.datasetId) as DatasetConfig | undefined;
  if (!config?.geoField) {
    return NextResponse.json({ ok: false, error: "unknown_dataset" }, { status: 400 });
  }

  const profile = await getProfile(session.user.id);
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
      console.error(result.error);
      return NextResponse.json(
        { ok: false, error: "opendata", page: result.page },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, page: result.page });
  }

  const limit = clampLimit(request.nextUrl.searchParams.get("limit"));
  const offset = clampOffset(request.nextUrl.searchParams.get("offset"));

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
    console.error(result.error);
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
