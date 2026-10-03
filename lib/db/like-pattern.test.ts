import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./queries";

describe("escapeLikePattern", () => {
  it("escapes percent, underscore, and backslash", () => {
    expect(escapeLikePattern("100%_done\\")).toBe("100\\%\\_done\\\\");
  });

  it("leaves plain text alone", () => {
    expect(escapeLikePattern("ada@example.com")).toBe("ada@example.com");
  });
});
