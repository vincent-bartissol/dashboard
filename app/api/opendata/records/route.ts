import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { bboxWhere, fetchRecordsSafe, joinWhere, type DatasetConfig } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";

const ALLOWED = new Set(Object.values(DATASETS).map((dataset) => dataset.id));

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const dataset = searchParams.get("dataset") ?? "";
  if (!ALLOWED.has(dataset)) {
    return NextResponse.json({ error: "Jeu de données inconnu" }, { status: 400 });
  }
  const config = Object.values(DATASETS).find((item) => item.id === dataset) as
    | DatasetConfig
    | undefined;
  if (!config) {
    return NextResponse.json({ error: "Jeu de données inconnu" }, { status: 400 });
  }

  const south = Number(searchParams.get("south"));
  const west = Number(searchParams.get("west"));
  const north = Number(searchParams.get("north"));
  const east = Number(searchParams.get("east"));
  const extra = searchParams.get("where") ?? undefined;
  const bbox =
    [south, west, north, east].every(Number.isFinite) && config.geoField
      ? bboxWhere(config.geoField, { south, west, north, east })
      : undefined;

  const page = await fetchRecordsSafe(
    dataset,
    { limit: 100, where: joinWhere(extra, bbox), host: config.host },
    config.revalidate,
  );
  return NextResponse.json(page);
}
