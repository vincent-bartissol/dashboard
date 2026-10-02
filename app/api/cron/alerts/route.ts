import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { evaluateVelibAlerts } from "@/lib/alerts/evaluate";
import { pingHealthchecks } from "@/lib/healthchecks";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "misconfigured" }, { status: 503 });
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!timingSafeEqual(digest(token), digest(secret))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await evaluateVelibAlerts();
    await pingHealthchecks(true);
    return NextResponse.json({ ok: true, ...result });
  } catch (cause) {
    console.error(cause);
    await pingHealthchecks(false);
    return NextResponse.json({ ok: false, error: "evaluate_failed" }, { status: 502 });
  }
}
