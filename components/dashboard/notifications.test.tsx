// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it } from "vitest";
import fr from "@/messages/fr.json";
import { NotificationProvider, useNotify } from "./notifications";

afterEach(() => {
  cleanup();
});

function Probe() {
  const notify = useNotify();
  return (
    <div>
      <button type="button" onClick={() => notify({ tone: "status", message: "Profil enregistré." })}>
        status
      </button>
      <button
        type="button"
        onClick={() => notify({ tone: "danger", message: "Impossible de mettre à jour ce favori." })}
      >
        danger
      </button>
    </div>
  );
}

function renderStack() {
  return render(
    <NextIntlClientProvider locale="fr" messages={fr}>
      <NotificationProvider>
        <Probe />
      </NotificationProvider>
    </NextIntlClientProvider>,
  );
}

describe("NotificationProvider", () => {
  it("exposes a labelled notifications region", () => {
    renderStack();
    expect(screen.getByRole("region", { name: "Notifications" })).toBeInTheDocument();
  });

  it("shows a status toast with aria-live polite", async () => {
    const user = userEvent.setup();
    renderStack();
    await user.click(screen.getByRole("button", { name: "status" }));
    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Profil enregistré.");
    expect(toast).toHaveAttribute("aria-live", "polite");
  });

  it("shows a danger toast as role=alert", async () => {
    const user = userEvent.setup();
    renderStack();
    await user.click(screen.getByRole("button", { name: "danger" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible de mettre à jour ce favori.",
    );
  });

  it("dismisses a toast when the close button is pressed", async () => {
    const user = userEvent.setup();
    renderStack();
    await user.click(screen.getByRole("button", { name: "status" }));
    expect(screen.getByRole("status")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Fermer la notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
