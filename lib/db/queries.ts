import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { favorite, profile } from "@/lib/db/schema";

export async function listFavorites(userId: string, datasetId?: string) {
  if (datasetId) {
    return db
      .select()
      .from(favorite)
      .where(and(eq(favorite.userId, userId), eq(favorite.datasetId, datasetId)));
  }
  return db.select().from(favorite).where(eq(favorite.userId, userId));
}

export async function getProfile(userId: string) {
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows[0] ?? { userId, firstName: null, lastName: null, arrondissement: null };
}
