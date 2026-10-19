import { expect, test } from "@playwright/test";
import { seedDemoSession } from "./session";

test("seeded session opens the overview", async ({ page }) => {
  await seedDemoSession(page, "user");
  await page.goto("/dashboard/fr/dashboard/");
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { level: 1, name: /Vue d.ensemble/ })).toBeVisible();
});

test("visitor can open admin without a server redirect", async ({ page }) => {
  await seedDemoSession(page, "user");
  await page.goto("/dashboard/fr/dashboard/admin/");
  await expect(page).toHaveURL(/\/dashboard\/fr\/dashboard\/admin\/?/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("nature tabs switch to parks", async ({ page }) => {
  await seedDemoSession(page, "user");
  await page.goto("/dashboard/fr/dashboard/nature/");
  await expect(page.getByRole("heading", { level: 1, name: "Nature" })).toBeVisible();
  await page.getByRole("link", { name: "Espaces verts", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/fr\/dashboard\/nature\/?\?tab=parks/);
  await expect(page.getByRole("link", { name: "Espaces verts", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
