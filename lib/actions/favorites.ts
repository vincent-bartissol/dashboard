"use server";

import { toggleFavoriteForUser, type ToggleFavoriteResult } from "@/lib/favorites";
import { requireSession } from "@/lib/session";

export type { ToggleFavoriteResult };

export async function toggleFavorite(input: {
  datasetId: string;
  recordId: string;
  label: string;
  geo?: string | null;
}): Promise<ToggleFavoriteResult> {
  const session = await requireSession();
  return toggleFavoriteForUser(session.user.id, input);
}
