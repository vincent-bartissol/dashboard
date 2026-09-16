"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profile, user } from "@/lib/db/schema";
import { displayName, PROFILE_NAME_MAX } from "@/lib/profile-name";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { parsePreferredDistrict } from "@/lib/opendata/arrondissement";
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

  const t = await getTranslations("Profile");
  if (!firstName || !lastName) {
    return { ok: false, error: t("namesRequired") };
  }
  if (firstName.length > PROFILE_NAME_MAX || lastName.length > PROFILE_NAME_MAX) {
    return { ok: false, error: t("namesTooLong") };
  }
  const district = parsePreferredDistrict(arrondissement);
  if (!district.ok) {
    return { ok: false, error: t("invalidDistrict") };
  }

  await db
    .insert(profile)
    .values({
      userId: session.user.id,
      firstName,
      lastName,
      arrondissement: district.value,
    })
    .onConflictDoUpdate({
      target: profile.userId,
      set: { firstName, lastName, arrondissement: district.value },
    });

  await db
    .update(user)
    .set({
      name: displayName(firstName, lastName),
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/dashboard`, "layout");
  }
  return { ok: true };
}
