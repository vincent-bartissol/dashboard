import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { alertRule } from "@/lib/db/schema";

export const ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000;
export const ALERT_MAX_PER_USER = 50;
export const VELIB_DATASET_ID = "velib-disponibilite-en-temps-reel";

export type AlertRuleRow = typeof alertRule.$inferSelect;

export async function listAlertRules(userId: string) {
  return db
    .select()
    .from(alertRule)
    .where(eq(alertRule.userId, userId))
    .orderBy(desc(alertRule.createdAt));
}

export async function listEnabledAlertRules() {
  return db.select().from(alertRule).where(eq(alertRule.enabled, true));
}

export async function createAlertRule(input: {
  userId: string;
  datasetId: string;
  recordId: string;
  label: string;
  threshold: number;
}) {
  const existing = await db
    .select()
    .from(alertRule)
    .where(
      and(
        eq(alertRule.userId, input.userId),
        eq(alertRule.datasetId, input.datasetId),
        eq(alertRule.recordId, input.recordId),
        eq(alertRule.metric, "bikes_below"),
      ),
    )
    .limit(1);
  if (existing[0]) {
    await db
      .update(alertRule)
      .set({
        label: input.label,
        threshold: input.threshold,
        enabled: true,
      })
      .where(eq(alertRule.id, existing[0].id));
    return existing[0].id;
  }
  const id = crypto.randomUUID();
  await db.insert(alertRule).values({
    id,
    userId: input.userId,
    datasetId: input.datasetId,
    recordId: input.recordId,
    label: input.label,
    metric: "bikes_below",
    threshold: input.threshold,
    enabled: true,
    lastTriggeredAt: null,
    createdAt: new Date(),
  });
  return id;
}

export async function deleteAlertRule(userId: string, id: string) {
  await db
    .delete(alertRule)
    .where(and(eq(alertRule.id, id), eq(alertRule.userId, userId)));
}

export async function setAlertRuleEnabled(userId: string, id: string, enabled: boolean) {
  await db
    .update(alertRule)
    .set({ enabled })
    .where(and(eq(alertRule.id, id), eq(alertRule.userId, userId)));
}

export async function markAlertTriggered(id: string, at = new Date()) {
  await db.update(alertRule).set({ lastTriggeredAt: at }).where(eq(alertRule.id, id));
}
