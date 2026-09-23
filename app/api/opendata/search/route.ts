import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import { searchOpenData } from "@/lib/opendata/global-search";
import { opendataSearchLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limited = opendataSearchLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ ok: false, error: "bad_query" }, { status: 400 });
  }

  try {
    const results = await searchOpenData(q);
    return NextResponse.json({ ok: true, results });
  } catch (cause) {
    console.error(cause);
    return NextResponse.json({ ok: false, error: "opendata" }, { status: 502 });
  }
}
