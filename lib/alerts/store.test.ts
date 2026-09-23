import { describe, expect, it } from "vitest";
import { ALERT_COOLDOWN_MS } from "./store";

describe("alert cooldown", () => {
  it("is two hours", () => {
    expect(ALERT_COOLDOWN_MS).toBe(2 * 60 * 60 * 1000);
  });
});
