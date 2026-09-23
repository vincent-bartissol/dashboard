import { NextRequest, NextResponse } from "next/server";
import { isBannedUser } from "@/lib/admin";
import {
  ALERT_MAX_PER_USER,
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  setAlertRuleEnabled,
  VELIB_DATASET_ID,
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
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
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
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const input = body as {
    datasetId?: string;
    recordId?: string;
    label?: string;
    threshold?: number;
    action?: "create" | "delete" | "enable" | "disable";
    id?: string;
  };

  if (input.action === "delete" && input.id) {
    await deleteAlertRule(session.user.id, input.id);
    return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
  }
  if ((input.action === "enable" || input.action === "disable") && input.id) {
    await setAlertRuleEnabled(session.user.id, input.id, input.action === "enable");
    return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
  }

  const threshold = Number(input.threshold ?? 3);
  if (
    input.datasetId !== VELIB_DATASET_ID ||
    !input.recordId?.trim() ||
    !input.label?.trim() ||
    !Number.isFinite(threshold) ||
    threshold < 1 ||
    threshold > 50
  ) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const existing = await listAlertRules(session.user.id);
  if (existing.length >= ALERT_MAX_PER_USER) {
    return NextResponse.json({ ok: false, error: "limit" }, { status: 403 });
  }

  await createAlertRule({
    userId: session.user.id,
    datasetId: input.datasetId,
    recordId: input.recordId.trim(),
    label: input.label.trim().slice(0, 200),
    threshold: Math.floor(threshold),
  });
  return NextResponse.json({ ok: true, rules: await listAlertRules(session.user.id) });
}
