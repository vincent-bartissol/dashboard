"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profile, user } from "@/lib/db/schema";
import { displayName } from "@/lib/profile-name";
import { requireSession } from "@/lib/session";

export type ProfileUpdateResult = { ok: true } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getProfile(userId: string) {
  const rows = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return rows[0] ?? { userId, firstName: null, lastName: null, arrondissement: null };
}

export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  email: string;
  arrondissement: string | null;
}): Promise<ProfileUpdateResult> {
  const session = await requireSession();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim();
  const arrondissement =
    input.arrondissement && input.arrondissement !== "" ? input.arrondissement : null;

  if (!firstName || !lastName) {
    return { ok: false, error: "Le prénom et le nom sont requis." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "L’e-mail n’est pas valide." };
  }

  if (email !== session.user.email) {
    const clash = await db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, email), ne(user.id, session.user.id)))
      .limit(1);
    if (clash[0]) {
      return { ok: false, error: "Cet e-mail est déjà utilisé." };
    }
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
      email,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
