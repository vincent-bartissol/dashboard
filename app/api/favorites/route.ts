import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { listFavorites } from "@/lib/db/queries";
import { toFavoriteDtos, toggleFavoriteForUser } from "@/lib/favorites";
import { favoritesApiLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireApiSession(favoritesApiLimit);
  if (!auth.ok) return auth.response;
  const rows = await listFavorites(auth.session.user.id);
  return NextResponse.json({ ok: true, favorites: toFavoriteDtos(rows) });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(favoritesApiLimit);
  if (!auth.ok) return auth.response;

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

  const result = await toggleFavoriteForUser(auth.session.user.id, {
    datasetId: input.datasetId,
    recordId: input.recordId,
    label: input.label,
    geo: input.geo,
  });
  if (!result.ok) {
    const status = result.error === "favoriteLimit" ? 403 : 400;
    return NextResponse.json(result, { status });
  }
  const rows = await listFavorites(auth.session.user.id);
  return NextResponse.json({ ok: true, favorites: toFavoriteDtos(rows) });
}
