// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import fr from "@/messages/fr.json";
import { AdminUserTable, type AdminUserRow } from "./user-table";

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

const users: AdminUserRow[] = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    emailVerified: true,
    roleLabel: "admin",
    statusLabel: "Actif",
    createdLabel: "2024-01-01",
  },
  {
    id: "2",
    name: "Grace Hopper",
    email: "grace@example.com",
    emailVerified: true,
    roleLabel: "user",
    statusLabel: "Actif",
    createdLabel: "2024-02-01",
  },
];

function renderTable(rows = users) {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <AdminUserTable users={rows} />
    </NextIntlClientProvider>,
  );
}

describe("AdminUserTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("filters rows by name or email", async () => {
    const user = userEvent.setup();
    renderTable();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Rechercher un utilisateur…"), "grace");
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderTable();
    await user.type(screen.getByLabelText("Rechercher un utilisateur…"), "nobody");
    expect(screen.getByText("Aucun utilisateur.")).toBeInTheDocument();
  });
});
