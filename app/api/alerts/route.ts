import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import { parseAlertBody } from "@/lib/alerts/parse-body";
import {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  setAlertRuleEnabled,
} from "@/lib/alerts/store";
import { alertsApiLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = alertsApiLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }
  const rules = await listAlertRules(session.user.id);
  return NextResponse.json({ ok: true, rules });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || isBannedUser(session.user)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const limited = alertsApiLimit.check(session.user.id);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const parsed = parseAlertBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (parsed.action === "delete") {
    await deleteAlertRule(session.user.id, parsed.id);
    return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
  }
  if (parsed.action === "enable" || parsed.action === "disable") {
    await setAlertRuleEnabled(session.user.id, parsed.id, parsed.action === "enable");
    return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
  }
  if (parsed.action !== "create") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const created = await createAlertRule({
    userId: session.user.id,
    datasetId: parsed.datasetId,
    recordId: parsed.recordId,
    label: parsed.label,
    threshold: parsed.threshold,
  });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: "limit" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
}
