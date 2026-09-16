import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/db/queries";
import { getSession } from "@/lib/session";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import { recordsQueryFromSearch } from "@/lib/opendata/bbox";
import { bboxWhere, fetchRecordsSafe, joinWhere, type DatasetConfig } from "@/lib/opendata/client";
import { DATASETS, PARIS_BBOX } from "@/lib/opendata/datasets";
import { opendataRecordsLimit } from "@/lib/rate-limit";

const ALLOWED = new Map(
  Object.values(DATASETS)
    .filter((dataset) => dataset.bbox)
    .map((dataset) => [dataset.id, dataset]),
);

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const limited = opendataRecordsLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "opendata" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const query = recordsQueryFromSearch(request.nextUrl.searchParams, PARIS_BBOX);
  if (!query.ok) {
    return NextResponse.json({ error: query.error }, { status: 400 });
  }

  const config = ALLOWED.get(query.datasetId) as DatasetConfig | undefined;
  if (!config?.geoField) {
    return NextResponse.json({ error: "Jeu de données inconnu" }, { status: 400 });
  }

  const profile = await getProfile(session.user.id);
  const district = arrondissementWhere(config, profile.arrondissement);
  const result = await fetchRecordsSafe(
    config.id,
    {
      limit: 100,
      where: joinWhere(district, bboxWhere(config.geoField, query.bbox)),
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
  return NextResponse.json({ ok: true, page: result.page });
}
