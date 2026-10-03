import { NextResponse } from "next/server";
import { isAdminUser, isBannedUser } from "@/lib/admin";
import type { RateLimitResult } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

type Limiter = { check: (key: string) => RateLimitResult };

export type ApiSession = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export type ApiAuthResult =
  | { ok: true; session: ApiSession }
  | { ok: false; response: NextResponse };

/** Shared session + ban (+ optional admin) + rate-limit gate for `/api/*` routes. */
export async function requireApiSession(
  limiter: Limiter,
  options?: { admin?: boolean },
): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }
  if (options?.admin && !isAdminUser(session.user)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
    };
  }
  const limited = limiter.check(session.user.id);
  if (!limited.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
      ),
    };
  }
  return { ok: true, session };
}
