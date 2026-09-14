"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profile, user } from "@/lib/db/schema";
import { displayName } from "@/lib/profile-name";
import { requireSession } from "@/lib/session";

export type ProfileUpdateResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  arrondissement: string | null;
}): Promise<ProfileUpdateResult> {
  const session = await requireSession();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const arrondissement =
    input.arrondissement && input.arrondissement !== "" ? input.arrondissement : null;

  if (!firstName || !lastName) {
    return { ok: false, error: "Le prénom et le nom sont requis." };
  }

  await db
    .insert(profile)
    .values({
      userId: session.user.id,
      firstName,
      lastName,
      arrondissement,
    })
    .onConflictDoUpdate({
      target: profile.userId,
      set: { firstName, lastName, arrondissement },
    });

  await db
    .update(user)
    .set({
      name: displayName(firstName, lastName),
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
