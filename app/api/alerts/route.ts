import { NextRequest, NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { parseAlertBody } from "@/lib/alerts/parse-body";
import {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  setAlertRuleEnabled,
} from "@/lib/alerts/store";
import { alertsApiLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireApiSession(alertsApiLimit);
  if (!auth.ok) return auth.response;
  const rules = await listAlertRules(auth.session.user.id);
  return NextResponse.json({ ok: true, rules });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiSession(alertsApiLimit);
  if (!auth.ok) return auth.response;

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
    await deleteAlertRule(auth.session.user.id, parsed.id);
    return NextResponse.json({ ok: true, rules: await listAlertRules(auth.session.user.id) });
  }
  if (parsed.action === "enable" || parsed.action === "disable") {
    await setAlertRuleEnabled(auth.session.user.id, parsed.id, parsed.action === "enable");
    return NextResponse.json({ ok: true, rules: await listAlertRules(auth.session.user.id) });
  }
  if (parsed.action !== "create") {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const created = await createAlertRule({
    userId: auth.session.user.id,
    datasetId: parsed.datasetId,
    recordId: parsed.recordId,
    label: parsed.label,
    threshold: parsed.threshold,
  });
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: "limit" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, rules: await listAlertRules(auth.session.user.id) });
}
