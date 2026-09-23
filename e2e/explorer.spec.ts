import { expect, test, type Locator, type Page } from "@playwright/test";
import { addSessionCookie } from "./session";

async function waitForOpenDataOrSkip(page: Page, ready: Locator) {
  const down = page.getByRole("status").filter({
    hasText: "Les données Open Data sont indisponibles",
  });
  // Avoid expect(down.or(ready)).toBeVisible() — when Open Data is down the page can
  // show both the banner and the ready control, which triggers a strict-mode violation.
  await expect
    .poll(
      async () => {
        if (await down.isVisible()) return "down";
        if (await ready.isVisible()) return "ready";
        return "pending";
      },
      { timeout: 30_000 },
    )
    .not.toBe("pending");
  if (await down.isVisible()) {
    test.skip(true, "Open Data unavailable");
  }
  await expect(ready).toBeVisible();
}

test("velib table filter hides unmatched rows", async ({ page, context }) => {
  test.setTimeout(60_000);
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/velib");
  await expect(page.getByRole("heading", { level: 1, name: /Vélib/ })).toBeVisible();

  const filter = page.getByLabel("Filtrer les lignes chargées…");
  await waitForOpenDataOrSkip(page, filter);

  await expect(page.getByRole("button", { name: "Ajouter aux favoris" }).first()).toBeVisible();
  await filter.fill("zzzx-no-such-station-xyz");
  await expect(page.getByText("Aucun résultat pour ce filtre.")).toBeVisible();
});

test("adding a velib favorite appears on the favorites page", async ({ page, context }) => {
  test.setTimeout(60_000);
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/velib");
  await expect(page.getByRole("heading", { level: 1, name: /Vélib/ })).toBeVisible();

  const addFavorite = page.getByRole("button", { name: "Ajouter aux favoris" }).first();
  await waitForOpenDataOrSkip(page, addFavorite);

  if (await addFavorite.isVisible()) {
    await addFavorite.click();
    await expect(page.getByRole("button", { name: "Retirer des favoris" }).first()).toBeVisible();
  }

  await page.goto("/fr/dashboard/favorites");
  await expect(page.getByRole("heading", { level: 1, name: "Favoris" })).toBeVisible();
  await expect(page.getByText("Aucun favori pour le moment")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Voir le thème" }).first()).toBeVisible();
});
