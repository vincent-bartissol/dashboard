"use server";

import { recordPageView } from "@/lib/activity";
import { requireSession } from "@/lib/session";

export type TrackPageViewResult =
  | { ok: true; recorded: true }
  | { ok: true; recorded: false }
  | { ok: false; error: "unauthorized" };

export async function trackPageView(pathname: string): Promise<TrackPageViewResult> {
  const session = await requireSession();
  const recorded = await recordPageView(session.user.id, pathname);
  return recorded ? { ok: true, recorded: true } : { ok: true, recorded: false };
}
