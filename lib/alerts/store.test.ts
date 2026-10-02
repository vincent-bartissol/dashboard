import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.hoisted(() => {
  process.env.DATA_DIR = `/tmp/dashboard-alerts-${process.pid}-${Date.now()}`;
});

import {
  ALERT_COOLDOWN_MS,
  ALERT_MAX_PER_USER,
  createAlertRule,
  listAlertRules,
  VELIB_DATASET_ID,
} from "./store";
import { stationCodesWhere } from "./evaluate";
import { db } from "@/lib/db";
import { alertRule, user } from "@/lib/db/schema";

const USER_ID = "alert-user-1";

describe("alert cooldown", () => {
  it("is two hours", () => {
    expect(ALERT_COOLDOWN_MS).toBe(2 * 60 * 60 * 1000);
  });
});

describe("stationCodesWhere", () => {
  it("builds an escaped ODS in() clause", () => {
    expect(stationCodesWhere(["9020", 'ab"c'])).toBe(
      'stationcode in ("9020","ab\\"c")',
    );
  });
});

describe("createAlertRule", () => {
  beforeAll(async () => {
    expect(process.env.DATA_DIR).toContain("dashboard-alerts-");
    await db.insert(user).values({
      id: USER_ID,
      name: "Alert",
      email: "alert@localhost",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  beforeEach(async () => {
    await db.delete(alertRule).where(eq(alertRule.userId, USER_ID));
  });

  it("upserts when the same station already has a rule", async () => {
    const first = await createAlertRule({
      userId: USER_ID,
      datasetId: VELIB_DATASET_ID,
      recordId: "9020",
      label: "Station A",
      threshold: 3,
    });
    expect(first).toEqual({ ok: true, id: expect.any(String) });

    const second = await createAlertRule({
      userId: USER_ID,
      datasetId: VELIB_DATASET_ID,
      recordId: "9020",
      label: "Station A renamed",
      threshold: 5,
    });
    expect(second).toEqual({ ok: true, id: (first as { id: string }).id });

    const rules = await listAlertRules(USER_ID);
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({
      label: "Station A renamed",
      threshold: 5,
      enabled: true,
    });
  });

  it("rejects a new station once the per-user cap is reached", async () => {
    for (let i = 0; i < ALERT_MAX_PER_USER; i += 1) {
      const result = await createAlertRule({
        userId: USER_ID,
        datasetId: VELIB_DATASET_ID,
        recordId: `station-${i}`,
        label: `Station ${i}`,
        threshold: 2,
      });
      expect(result.ok).toBe(true);
    }

    const over = await createAlertRule({
      userId: USER_ID,
      datasetId: VELIB_DATASET_ID,
      recordId: "station-over",
      label: "Overflow",
      threshold: 2,
    });
    expect(over).toEqual({ ok: false, error: "limit" });
    expect(await listAlertRules(USER_ID)).toHaveLength(ALERT_MAX_PER_USER);
  });
});
