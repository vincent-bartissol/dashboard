// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatasetTabs } from "./dataset-tabs";

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("DatasetTabs", () => {
  afterEach(() => {
    cleanup();
  });

  it("marks the active tab as the current page", () => {
    render(
      <DatasetTabs
        active="/dashboard/nature?tab=parks"
        tabs={[
          { href: "/dashboard/nature", label: "Arbres" },
          { href: "/dashboard/nature?tab=parks", label: "Espaces verts" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Espaces verts" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Arbres" })).not.toHaveAttribute("aria-current");
  });

  it("renders /dev tabs as plain anchors", () => {
    const { container } = render(
      <DatasetTabs
        active="/dev/emails"
        tabs={[
          { href: "/dev/emails", label: "Emails" },
          { href: "/dashboard/nature", label: "Nature" },
        ]}
      />,
    );
    const email = screen.getByRole("link", { name: "Emails" });
    expect(email.tagName).toBe("A");
    expect(email).toHaveAttribute("href", "/dev/emails");
    expect(email).toHaveAttribute("aria-current", "page");
    expect(container.querySelector("a[href='/dev/emails']")).not.toBeNull();
  });
});
