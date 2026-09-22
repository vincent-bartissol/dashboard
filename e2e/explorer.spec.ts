import { expect, test } from "@playwright/test";
import { addSessionCookie } from "./session";

test("velib table filter hides unmatched rows", async ({ page, context }) => {
  test.setTimeout(60_000);
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/velib");
  await expect(page.getByRole("heading", { level: 1, name: /Vélib/ })).toBeVisible();

  const down = page.getByRole("status").filter({
    hasText: "Les données Open Data sont indisponibles",
  });
  const filter = page.getByLabel("Filtrer le tableau et la carte…");
  await expect(down.or(filter)).toBeVisible({ timeout: 30_000 });
  if (await down.isVisible()) {
    test.skip(true, "Open Data unavailable");
  }

  await expect(page.getByRole("button", { name: "Ajouter aux favoris" }).first()).toBeVisible();
  await filter.fill("zzzx-no-such-station-xyz");
  await expect(page.getByText("Aucun résultat pour ce filtre.")).toBeVisible();
});

test("adding a velib favorite appears on the favorites page", async ({ page, context }) => {
  test.setTimeout(60_000);
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/velib");
  await expect(page.getByRole("heading", { level: 1, name: /Vélib/ })).toBeVisible();

  const down = page.getByRole("status").filter({
    hasText: "Les données Open Data sont indisponibles",
  });
  const addFavorite = page.getByRole("button", { name: "Ajouter aux favoris" });
  await expect(down.or(addFavorite.first())).toBeVisible({ timeout: 30_000 });
  if (await down.isVisible()) {
    test.skip(true, "Open Data unavailable");
  }

  const firstAdd = addFavorite.first();
  if (await firstAdd.isVisible()) {
    await firstAdd.click();
    await expect(page.getByRole("button", { name: "Retirer des favoris" }).first()).toBeVisible();
  }

  await page.goto("/fr/dashboard/favorites");
  await expect(page.getByRole("heading", { level: 1, name: "Favoris" })).toBeVisible();
  await expect(page.getByText("Aucun favori pour le moment")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Voir le thème" }).first()).toBeVisible();
});
