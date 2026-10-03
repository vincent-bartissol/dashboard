import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import {
  loadThemeMarkers,
  loadThemePage,
  resolveThemeDataset,
  THEME_PAGE_MAX,
  THEME_PAGE_SIZE,
} from "@/lib/opendata/theme-api";
import { clampLimitParam, clampOffsetParam } from "@/lib/opendata/page-clamp";
import { logOpendataFailure } from "@/lib/opendata/log-failure";
import { opendataThemeLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(opendataThemeLimit);
  if (!auth.ok) return auth.response;

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
    const result = await loadThemeMarkers(config, auth.session.user.id, loadOpts);
    if (result.error === "bad_district") {
      return NextResponse.json({ ok: false, error: "bad_district" }, { status: 400 });
    }
    if (!result.ok) {
      logOpendataFailure("theme/markers", result.error ?? "opendata");
      return NextResponse.json(
        { ok: false, error: "opendata", page: result.page },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, page: result.page });
  }

  const limit = clampLimitParam(request.nextUrl.searchParams.get("limit"), {
    size: THEME_PAGE_SIZE,
    max: THEME_PAGE_MAX,
  });
  const offset = clampOffsetParam(request.nextUrl.searchParams.get("offset"));

  const result = await loadThemePage(config, auth.session.user.id, {
    ...loadOpts,
    limit,
    offset,
  });
  if (result.error === "bad_district") {
    return NextResponse.json({ ok: false, error: "bad_district" }, { status: 400 });
  }
  if (!result.ok) {
    logOpendataFailure("theme/page", result.error ?? "opendata");
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
