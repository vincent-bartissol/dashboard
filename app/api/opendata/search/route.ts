import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { searchOpenData } from "@/lib/opendata/global-search";
import { logOpendataFailure } from "@/lib/opendata/log-failure";
import { opendataSearchLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await requireApiSession(opendataSearchLimit);
  if (!auth.ok) return auth.response;

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
    logOpendataFailure("search", cause);
    return NextResponse.json({ ok: false, error: "opendata" }, { status: 502 });
  }
}
