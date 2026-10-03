import { describe, expect, it } from "vitest";
import { parseAlertBody } from "./parse-body";
import { VELIB_DATASET_ID } from "./store";

describe("parseAlertBody", () => {
  it("accepts a valid create payload", () => {
    expect(
      parseAlertBody({
        datasetId: VELIB_DATASET_ID,
        recordId: "11030",
        label: "Nation",
        threshold: 3,
      }),
    ).toEqual({
      ok: true,
      action: "create",
      datasetId: VELIB_DATASET_ID,
      recordId: "11030",
      label: "Nation",
      threshold: 3,
    });
  });

  it("rejects oversized or hostile recordId", () => {
    expect(
      parseAlertBody({
        datasetId: VELIB_DATASET_ID,
        recordId: "x".repeat(65),
        label: "Nation",
        threshold: 3,
      }),
    ).toEqual({ ok: false, error: "bad_request" });

    expect(
      parseAlertBody({
        datasetId: VELIB_DATASET_ID,
        recordId: '11030") OR (1=1',
        label: "Nation",
        threshold: 3,
      }),
    ).toEqual({ ok: false, error: "bad_request" });
  });

  it("rejects unknown actions and bad rule ids", () => {
    expect(parseAlertBody({ action: "explode", id: "abc" })).toEqual({
      ok: false,
      error: "bad_request",
    });
    expect(parseAlertBody({ action: "delete", id: "not valid!" })).toEqual({
      ok: false,
      error: "bad_request",
    });
  });

  it("parses delete / enable / disable", () => {
    expect(parseAlertBody({ action: "delete", id: "rule-1" })).toEqual({
      ok: true,
      action: "delete",
      id: "rule-1",
    });
    expect(parseAlertBody({ action: "enable", id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })).toEqual({
      ok: true,
      action: "enable",
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    });
  });

  it("truncates labels to 200 chars", () => {
    const label = "a".repeat(250);
    const parsed = parseAlertBody({
      datasetId: VELIB_DATASET_ID,
      recordId: "11030",
      label,
      threshold: 2,
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action === "create") {
      expect(parsed.label).toHaveLength(200);
    }
  });
});
