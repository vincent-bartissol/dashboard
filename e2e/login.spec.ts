import { expect, test } from "@playwright/test";

test("login enters the dashboard as a visitor", async ({ page }) => {
  await page.goto("/dashboard/fr/login/");
  await page.getByRole("button", { name: "Entrer comme visiteur" }).click();
  await expect(page).toHaveURL(/\/dashboard\/fr\/dashboard\/?/);
  await expect(page.getByRole("heading", { level: 1, name: /Vue d.ensemble/ })).toBeVisible();
});

test("login enters the dashboard as an administrator", async ({ page }) => {
  await page.goto("/dashboard/fr/login/");
  await page.getByRole("button", { name: "Entrer comme administrateur" }).click();
  await expect(page).toHaveURL(/\/dashboard\/fr\/dashboard\/?/);
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
});
