import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { alertMail } from "@/lib/email/templates";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { fetchAllRecords } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import { themeOrderBy } from "@/lib/opendata/order-by";
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

function bikesFor(record: Record<string, unknown> | undefined) {
  if (!record) return null;
  const value = Number(record.numbikesavailable);
  return Number.isFinite(value) ? value : null;
}

export async function evaluateVelibAlerts(now = Date.now()): Promise<EvaluateAlertsResult> {
  const rules = (await listEnabledAlertRules()).filter(
    (rule) => rule.datasetId === VELIB_DATASET_ID && rule.metric === "bikes_below",
  );
  if (rules.length === 0) {
    return { checked: 0, triggered: 0, emailed: 0 };
  }

  const velib = DATASETS.velib;
  const page = await fetchAllRecords(velib.id, velib.revalidate, {
    max: 1600,
    orderBy: themeOrderBy(velib),
    host: velib.host,
  });
  if (!page.ok) {
    throw new Error(page.error ?? "opendata");
  }

  const byStation = new Map<string, Record<string, unknown>>();
  for (const row of page.page.results) {
    const code = String(row.stationcode ?? "");
    if (code) byStation.set(code, row);
  }

  let triggered = 0;
  let emailed = 0;

  for (const rule of rules) {
    if (rule.lastTriggeredAt) {
      const last = new Date(rule.lastTriggeredAt).getTime();
      if (Number.isFinite(last) && now - last < ALERT_COOLDOWN_MS) continue;
    }
    const bikes = bikesFor(byStation.get(rule.recordId));
    if (bikes == null || bikes >= rule.threshold) continue;

    triggered += 1;
    await markAlertTriggered(rule.id, new Date(now));
    const sent = await sendAlertEmail(rule, bikes);
    if (sent) emailed += 1;
  }

  return { checked: rules.length, triggered, emailed };
}

async function sendAlertEmail(rule: AlertRuleRow, bikes: number) {
  const rows = await db
    .select({ email: user.email, emailVerified: user.emailVerified })
    .from(user)
    .where(eq(user.id, rule.userId))
    .limit(1);
  const owner = rows[0];
  if (!owner?.email || !owner.emailVerified) return false;

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
  return true;
}
