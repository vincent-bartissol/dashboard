"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profile } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export async function getProfile(userId: string) {
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows[0] ?? { userId, arrondissement: null };
}

export async function saveArrondissement(arrondissement: string | null) {
  const session = await requireSession();
  const value = arrondissement && arrondissement !== "" ? arrondissement : null;
  await db
    .insert(profile)
    .values({
      userId: session.user.id,
      arrondissement: value,
    })
    .onConflictDoUpdate({
      target: profile.userId,
      set: { arrondissement: value },
    });
  revalidatePath("/dashboard");
}
