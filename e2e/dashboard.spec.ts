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
