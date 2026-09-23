import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import {
  loadThemeMarkers,
  loadThemePage,
  resolveThemeDataset,
  THEME_PAGE_MAX,
  THEME_PAGE_SIZE,
} from "@/lib/opendata/theme-api";
import { opendataThemeLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limited = opendataThemeLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const datasetId = request.nextUrl.searchParams.get("dataset");
  const district = request.nextUrl.searchParams.get("district");
  const mode = request.nextUrl.searchParams.get("mode");
  const config = resolveThemeDataset(datasetId);
  if (!config) {
    return NextResponse.json({ ok: false, error: "unknown_dataset" }, { status: 400 });
  }

  const loadOpts = {
    district: district === null ? undefined : district,
    ignoreProfile: district !== null,
  };

  if (mode === "markers") {
    const result = await loadThemeMarkers(config, session.user.id, loadOpts);
    if (result.error === "bad_district") {
      return NextResponse.json({ ok: false, error: "bad_district" }, { status: 400 });
    }
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: "opendata", page: result.page },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, page: result.page });
  }

  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? THEME_PAGE_SIZE);
  const offsetRaw = Number(request.nextUrl.searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(THEME_PAGE_MAX, Math.max(1, Math.floor(limitRaw)))
    : THEME_PAGE_SIZE;
  const offset = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

  const result = await loadThemePage(config, session.user.id, {
    ...loadOpts,
    limit,
    offset,
  });
  if (result.error === "bad_district") {
    return NextResponse.json({ ok: false, error: "bad_district" }, { status: 400 });
  }
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: "opendata", page: result.page },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    page: result.page,
    nextOffset: result.nextOffset,
    hasMore: result.hasMore,
  });
}
