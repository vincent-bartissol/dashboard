import { VELIB_DATASET_ID } from "@/lib/alerts/store";

const RECORD_ID_RE = /^[A-Za-z0-9._:-]{1,64}$/;
const RULE_ID_RE = /^[A-Za-z0-9-]{1,64}$/;

export type AlertAction = "create" | "delete" | "enable" | "disable";

export type ParsedAlertBody =
  | { ok: true; action: "delete"; id: string }
  | { ok: true; action: "enable"; id: string }
  | { ok: true; action: "disable"; id: string }
  | {
      ok: true;
      action: "create";
      datasetId: typeof VELIB_DATASET_ID;
      recordId: string;
      label: string;
      threshold: number;
    }
  | { ok: false; error: "bad_request" };

function asRecord(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

function stringField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function parseAlertBody(body: unknown): ParsedAlertBody {
  const input = asRecord(body);
  if (!input) return { ok: false, error: "bad_request" };

  const actionRaw = input.action;
  const action =
    actionRaw === undefined || actionRaw === null
      ? "create"
      : typeof actionRaw === "string"
        ? actionRaw
        : null;

  if (action === "delete" || action === "enable" || action === "disable") {
    const id = stringField(input.id);
    if (!id || !RULE_ID_RE.test(id)) return { ok: false, error: "bad_request" };
    return { ok: true, action, id };
  }

  if (action !== "create") return { ok: false, error: "bad_request" };

  const datasetId = stringField(input.datasetId);
  const recordId = stringField(input.recordId);
  const label = stringField(input.label);
  const threshold = Number(input.threshold ?? 3);

  if (
    datasetId !== VELIB_DATASET_ID ||
    !recordId ||
    !RECORD_ID_RE.test(recordId) ||
    !label ||
    !Number.isFinite(threshold) ||
    threshold < 1 ||
    threshold > 50
  ) {
    return { ok: false, error: "bad_request" };
  }

  return {
    ok: true,
    action: "create",
    datasetId: VELIB_DATASET_ID,
    recordId,
    label: label.slice(0, 200),
    threshold: Math.floor(threshold),
  };
}
