import { inArray } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { alertMail } from "@/lib/email/templates";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { fetchRecordsSafe, type DatasetConfig } from "@/lib/opendata/client";
import { scalarString } from "@/lib/safe-string";
import { DATASETS } from "@/lib/opendata/datasets";
import {
  ALERT_COOLDOWN_MS,
  listEnabledAlertRules,
  markAlertTriggered,
  VELIB_DATASET_ID,
  type AlertRuleRow,
} from "@/lib/alerts/store";
import type { AppLocale } from "@/i18n/routing";

export type EvaluateAlertsResult = {
  checked: number;
  triggered: number;
  emailed: number;
};

const STATION_CHUNK = 50;

function bikesFor(record: Record<string, unknown> | undefined) {
  if (!record) return null;
  const value = Number(record.numbikesavailable);
  return Number.isFinite(value) ? value : null;
}

function escapeStationCode(value: string) {
  return value.replaceAll("\\", String.raw`\\`).replaceAll('"', String.raw`\"`);
}

export function stationCodesWhere(codes: string[]) {
  const escaped = codes.map((code) => `"${escapeStationCode(code)}"`);
  return `stationcode in (${escaped.join(",")})`;
}

function chunkCodes(codes: string[], size: number) {
  const chunks: string[][] = [];
  for (let i = 0; i < codes.length; i += size) {
    chunks.push(codes.slice(i, i + size));
  }
  return chunks;
}

async function fetchVelibStationChunk(velib: DatasetConfig, chunk: string[]) {
  const result = await fetchRecordsSafe(
    velib.id,
    {
      limit: 100,
      where: stationCodesWhere(chunk),
      host: velib.host,
      select: "stationcode,numbikesavailable",
    },
    velib.revalidate,
  );
  if (!result.ok) {
    throw new Error(result.error ?? "opendata");
  }
  return result.page.results;
}

function mergeStationRows(
  byStation: Map<string, Record<string, unknown>>,
  rows: Record<string, unknown>[],
) {
  for (const row of rows) {
    const code = scalarString(row.stationcode);
    if (code) byStation.set(code, row);
  }
}

async function loadStationsByCode(
  velib: DatasetConfig,
  codes: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const byStation = new Map<string, Record<string, unknown>>();
  for (const chunk of chunkCodes(codes, STATION_CHUNK)) {
    const rows = await fetchVelibStationChunk(velib, chunk);
    mergeStationRows(byStation, rows);
  }
  return byStation;
}

export async function evaluateVelibAlerts(now = Date.now()): Promise<EvaluateAlertsResult> {
  const rules = (await listEnabledAlertRules()).filter(
    (rule) => rule.datasetId === VELIB_DATASET_ID && rule.metric === "bikes_below",
  );
  if (rules.length === 0) {
    return { checked: 0, triggered: 0, emailed: 0 };
  }

  const stationCodes = [...new Set(rules.map((rule) => rule.recordId).filter(Boolean))];
  const velib: DatasetConfig = DATASETS.velib;
  const byStation = await loadStationsByCode(velib, stationCodes);

  const userIds = [...new Set(rules.map((rule) => rule.userId))];
  const owners = await db
    .select({ id: user.id, email: user.email, emailVerified: user.emailVerified })
    .from(user)
    .where(inArray(user.id, userIds));
  const ownersById = new Map(owners.map((row) => [row.id, row]));

  let triggered = 0;
  let emailed = 0;

  for (const rule of rules) {
    const outcome = await tryTriggerVelibRule(rule, byStation, ownersById, now);
    if (outcome === "skipped") continue;
    triggered += 1;
    if (outcome === "sent") emailed += 1;
  }

  return { checked: rules.length, triggered, emailed };
}

async function tryTriggerVelibRule(
  rule: AlertRuleRow,
  byStation: Map<string, Record<string, unknown>>,
  ownersById: Map<string, { email: string; emailVerified: boolean }>,
  now: number,
): Promise<"skipped" | "sent" | "triggered"> {
  if (rule.lastTriggeredAt) {
    const last = new Date(rule.lastTriggeredAt).getTime();
    if (Number.isFinite(last) && now - last < ALERT_COOLDOWN_MS) return "skipped";
  }
  const bikes = bikesFor(byStation.get(rule.recordId));
  if (bikes == null || bikes >= rule.threshold) return "skipped";

  try {
    const outcome = await sendAlertEmail(rule, bikes, ownersById);
    // Only cool down after a successful send or an intentional skip (no/unverified email).
    // Delivery failures leave lastTriggeredAt untouched so the next cron can retry.
    await markAlertTriggered(rule.id, new Date(now));
    return outcome === "sent" ? "sent" : "triggered";
  } catch {
    return "skipped";
  }
}

async function sendAlertEmail(
  rule: AlertRuleRow,
  bikes: number,
  ownersById: Map<string, { email: string; emailVerified: boolean }>,
): Promise<"sent" | "skipped"> {
  const owner = ownersById.get(rule.userId);
  if (!owner?.email || !owner.emailVerified) return "skipped";

  const locale: AppLocale = "fr";
  const base = process.env.BETTER_AUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const mail = alertMail(
    {
      station: rule.label,
      bikes: String(bikes),
      threshold: String(rule.threshold),
      url: `${base}/fr/dashboard/alerts`,
    },
    locale,
  );
  await sendEmail({ to: owner.email, ...mail });
  return "sent";
}
