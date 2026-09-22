import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import { getProfile } from "@/lib/db/queries";
import { arrondissementWhere } from "@/lib/opendata/arrondissement";
import { fetchRecordsSafe, joinWhere, type DatasetConfig } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
import { opendataEventsLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = opendataEventsLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0);
  const config: DatasetConfig = DATASETS.events;
  const profile = await getProfile(session.user.id);
  const district = arrondissementWhere(config, profile.arrondissement);
  const result = await fetchRecordsSafe(
    config.id,
    {
      limit: PAGE_SIZE,
      offset,
      where: joinWhere(district, config.defaultWhere),
      orderBy: themeOrderBy(config),
      host: config.host,
    },
    config.revalidate,
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "opendata", page: result.page },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    page: result.page,
    nextOffset: offset + result.page.results.length,
    hasMore: offset + result.page.results.length < result.page.total_count,
  });
}
