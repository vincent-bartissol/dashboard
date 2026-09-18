"use server";

import { recordPageView } from "@/lib/activity";
import { requireSession } from "@/lib/session";

export async function trackPageView(pathname: string): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const ok = await recordPageView(session.user.id, pathname);
  return { ok };
}
