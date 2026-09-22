import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import { loadThemePage, resolveThemeDataset } from "@/lib/opendata/theme-api";
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
  const config = resolveThemeDataset(datasetId);
  if (!config) {
    return NextResponse.json({ ok: false, error: "unknown_dataset" }, { status: 400 });
  }

  const result = await loadThemePage(config, session.user.id, {
    district: district === null ? undefined : district,
    ignoreProfile: district !== null,
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
  return NextResponse.json({ ok: true, page: result.page });
}
