// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

function renderTable(
  rows = users,
  options?: { search?: string; page?: number; totalPages?: number },
) {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <AdminUserTable
        users={rows}
        search={options?.search}
        page={options?.page}
        totalPages={options?.totalPages}
      />
    </NextIntlClientProvider>,
  );
}

describe("AdminUserTable", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders supplied rows and seeds the search field", () => {
    renderTable(users, { search: "grace" });
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("grace@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText("Rechercher un utilisateur…")).toHaveValue("grace");
  });

  it("shows an empty state when there are no users", () => {
    renderTable([]);
    expect(screen.getByText("Aucun utilisateur.")).toBeInTheDocument();
  });

  it("renders pagination links when there are multiple pages", () => {
    renderTable(users, { search: "ada", page: 2, totalPages: 3 });
    expect(screen.getByText("Page 2 sur 3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Précédent" })).toHaveAttribute(
      "href",
      "/dashboard/admin?q=ada",
    );
    expect(screen.getByRole("link", { name: "Suivant" })).toHaveAttribute(
      "href",
      "/dashboard/admin?q=ada&page=3",
    );
  });
});
