import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { alertRule } from "@/lib/db/schema";

export const ALERT_COOLDOWN_MS = 2 * 60 * 60 * 1000;
export const ALERT_MAX_PER_USER = 50;
export const VELIB_DATASET_ID = "velib-disponibilite-en-temps-reel";

export type AlertRuleRow = typeof alertRule.$inferSelect;

export type CreateAlertResult =
  | { ok: true; id: string }
  | { ok: false; error: "limit" };

export function listAlertRules(userId: string) {
  return db
    .select()
    .from(alertRule)
    .where(eq(alertRule.userId, userId))
    .orderBy(desc(alertRule.createdAt));
}

export function listEnabledAlertRules() {
  return db.select().from(alertRule).where(eq(alertRule.enabled, true));
}

export function createAlertRule(input: {
  userId: string;
  datasetId: string;
  recordId: string;
  label: string;
  threshold: number;
}): CreateAlertResult {
  return db.transaction((tx) => {
    const existing = tx
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
      .limit(1)
      .all();

    if (existing[0]) {
      tx.update(alertRule)
        .set({
          label: input.label,
          threshold: input.threshold,
          enabled: true,
        })
        .where(eq(alertRule.id, existing[0].id))
        .run();
      return { ok: true as const, id: existing[0].id };
    }

    const total = tx
      .select({ n: count() })
      .from(alertRule)
      .where(eq(alertRule.userId, input.userId))
      .all();
    if ((total[0]?.n ?? 0) >= ALERT_MAX_PER_USER) {
      return { ok: false as const, error: "limit" as const };
    }

    const id = crypto.randomUUID();
    tx.insert(alertRule)
      .values({
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
      })
      .run();
    return { ok: true as const, id };
  });
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
