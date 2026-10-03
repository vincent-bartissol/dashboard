import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { favorite } from "@/lib/db/schema";
import { recordActivity } from "@/lib/activity";
import { isAtFavoriteLimit, parseFavoriteInput, type FavoriteInput } from "@/lib/favorite-input";
import { listFavorites } from "@/lib/db/queries";

export type ToggleFavoriteResult = { ok: true } | { ok: false; error: string };

export type FavoriteDto = {
  id: string;
  datasetId: string;
  recordId: string;
  label: string;
  geo: string | null;
};

export async function toggleFavoriteForUser(
  userId: string,
  input: FavoriteInput,
): Promise<ToggleFavoriteResult> {
  const parsed = parseFavoriteInput(input);
  if (!parsed.ok) {
    return { ok: false, error: "favorite" };
  }
  try {
    const existing = await db
      .select()
      .from(favorite)
      .where(
        and(
          eq(favorite.userId, userId),
          eq(favorite.datasetId, parsed.datasetId),
          eq(favorite.recordId, parsed.recordId),
        ),
      )
      .limit(1);

    if (existing[0]) {
      await db.delete(favorite).where(eq(favorite.id, existing[0].id));
      await recordActivity(userId, "favorite.remove", {
        datasetId: parsed.datasetId,
        recordId: parsed.recordId,
        label: parsed.label,
      });
    } else {
      const inserted = db.transaction((tx) => {
        const total = tx
          .select({ n: count() })
          .from(favorite)
          .where(eq(favorite.userId, userId))
          .all();
        if (isAtFavoriteLimit(total[0]?.n ?? 0)) {
          return { ok: false as const, error: "favoriteLimit" as const };
        }
        tx.insert(favorite)
          .values({
            id: crypto.randomUUID(),
            userId,
            datasetId: parsed.datasetId,
            recordId: parsed.recordId,
            label: parsed.label,
            geo: parsed.geo,
            createdAt: new Date(),
          })
          .run();
        return { ok: true as const };
      });
      if (!inserted.ok) {
        return { ok: false, error: "favoriteLimit" };
      }
      await recordActivity(userId, "favorite.add", {
        datasetId: parsed.datasetId,
        recordId: parsed.recordId,
        label: parsed.label,
      });
    }

    // Client refreshes via useFavoritesQuery; theme pages are already dynamic.
    return { ok: true };
  } catch {
    return { ok: false, error: "favorite" };
  }
}

export function toFavoriteDtos(
  rows: Awaited<ReturnType<typeof listFavorites>>,
): FavoriteDto[] {
  return rows.map((row) => ({
    id: row.id,
    datasetId: row.datasetId,
    recordId: row.recordId,
    label: row.label,
    geo: row.geo,
  }));
}
