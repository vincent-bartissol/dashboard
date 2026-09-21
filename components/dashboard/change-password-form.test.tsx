// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import fr from "@/messages/fr.json";
import { ChangePasswordForm } from "./change-password-form";

vi.mock("@/lib/auth-client", () => ({
  authClient: { changePassword: vi.fn() },
}));

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

const changePasswordMock = vi.mocked(authClient.changePassword);

function renderForm() {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <ChangePasswordForm />
    </NextIntlClientProvider>,
  );
}

async function fillPasswords(values: {
  current: string;
  next: string;
  confirm: string;
}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Mot de passe actuel"), values.current);
  await user.type(screen.getByLabelText("Nouveau mot de passe"), values.next);
  await user.type(screen.getByLabelText("Confirmer le mot de passe"), values.confirm);
  fireEvent.submit(screen.getByRole("heading", { name: "Mot de passe" }).closest("form")!);
}

describe("ChangePasswordForm", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a password shorter than 8 characters", async () => {
    renderForm();
    await fillPasswords({ current: "old-password", next: "short", confirm: "short" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Le mot de passe doit contenir au moins 8 caractères.",
    );
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("rejects a confirmation mismatch", async () => {
    renderForm();
    await fillPasswords({
      current: "old-password",
      next: "new-password",
      confirm: "other-password",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Les mots de passe ne correspondent pas.",
    );
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("rejects a new password identical to the current one", async () => {
    renderForm();
    await fillPasswords({
      current: "same-password",
      next: "same-password",
      confirm: "same-password",
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Le nouveau mot de passe doit être différent.",
    );
    expect(changePasswordMock).not.toHaveBeenCalled();
  });
});
