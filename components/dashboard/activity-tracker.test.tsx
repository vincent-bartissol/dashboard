// @vitest-environment jsdom
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardActivityTracker } from "./activity-tracker";

const { trackPageView } = vi.hoisted(() => ({
  trackPageView: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/actions/activity", () => ({
  trackPageView,
}));

describe("DashboardActivityTracker", () => {
  afterEach(() => {
    cleanup();
    trackPageView.mockReset();
  });

  it("swallows a rejected page-view action", async () => {
    let rejectAction: (error: Error) => void = () => {};
    trackPageView.mockImplementation(
      () =>
        new Promise<never>((_resolve, reject) => {
          rejectAction = reject;
        }),
    );
    const reasons: unknown[] = [];
    const onRejection = (event: PromiseRejectionEvent) => {
      reasons.push(event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", onRejection);

    render(<DashboardActivityTracker />);

    await waitFor(() => {
      expect(trackPageView).toHaveBeenCalledWith("/dashboard");
    });
    await act(async () => {
      rejectAction(new Error("An unexpected response was received from the server."));
    });
    expect(reasons).toEqual([]);

    window.removeEventListener("unhandledrejection", onRejection);
  });
});
