import { expect, test } from "@playwright/test";
import { addSessionCookie } from "./session";

test("seeded session opens the overview", async ({ page, context }) => {
  await addSessionCookie(context);
  await page.goto("/fr/dashboard");
  await expect(page).not.toHaveURL(/\/fr\/login/);
  await expect(page.getByRole("heading", { level: 1, name: /Vue d.ensemble/ })).toBeVisible();
});

test("seeded non-admin is redirected away from admin", async ({ page, context }) => {
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/admin");
  await expect(page).not.toHaveURL(/\/fr\/dashboard\/admin/);
  await expect(page).toHaveURL(/\/fr\/dashboard\/?$/);
});

test("nature tabs switch to parks", async ({ page, context }) => {
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/nature");
  await expect(page.getByRole("heading", { level: 1, name: "Nature" })).toBeVisible();
  await page.getByRole("link", { name: "Espaces verts" }).click();
  await expect(page).toHaveURL(/\/fr\/dashboard\/nature\?tab=parks/);
  await expect(page.getByRole("link", { name: "Espaces verts" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
