import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import { listFavorites } from "@/lib/db/queries";
import { toFavoriteDtos, toggleFavoriteForUser } from "@/lib/favorites";
import { favoritesApiLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = favoritesApiLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const rows = await listFavorites(session.user.id);
  return NextResponse.json({ ok: true, favorites: toFavoriteDtos(rows) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = favoritesApiLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "favorite" }, { status: 400 });
  }
  const input = body as {
    datasetId?: string;
    recordId?: string;
    label?: string;
    geo?: string | null;
  };
  if (!input.datasetId || !input.recordId || !input.label) {
    return NextResponse.json({ ok: false, error: "favorite" }, { status: 400 });
  }

  const result = await toggleFavoriteForUser(session.user.id, {
    datasetId: input.datasetId,
    recordId: input.recordId,
    label: input.label,
    geo: input.geo,
  });
  if (!result.ok) {
    const status = result.error === "favoriteLimit" ? 403 : 400;
    return NextResponse.json(result, { status });
  }
  const rows = await listFavorites(session.user.id);
  return NextResponse.json({ ok: true, favorites: toFavoriteDtos(rows) });
}
