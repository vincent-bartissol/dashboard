"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { favorite } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function toggleFavorite(input: {
  datasetId: string;
  recordId: string;
  label: string;
  geo?: string | null;
}) {
  const session = await requireSession();
  const existing = await db
    .select()
    .from(favorite)
    .where(
      and(
        eq(favorite.userId, session.user.id),
        eq(favorite.datasetId, input.datasetId),
        eq(favorite.recordId, input.recordId),
      ),
    )
    .limit(1);

  if (existing[0]) {
    await db.delete(favorite).where(eq(favorite.id, existing[0].id));
  } else {
    await db.insert(favorite).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      datasetId: input.datasetId,
      recordId: input.recordId,
      label: input.label,
      geo: input.geo ?? null,
      createdAt: new Date(),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/favorites");
}
