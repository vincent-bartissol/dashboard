// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DashboardActivityTracker } from "./activity-tracker";

describe("DashboardActivityTracker", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing in the static demo", () => {
    const { container } = render(<DashboardActivityTracker />);
    expect(container.firstChild).toBeNull();
  });
});
