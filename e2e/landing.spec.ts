import { expect, test } from "@playwright/test";

test("landing renders French chrome", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Se connecter" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Créer un compte" }).first()).toBeVisible();
});
