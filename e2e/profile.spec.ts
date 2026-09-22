import { expect, test } from "@playwright/test";
import { addSessionCookie } from "./session";

test("profile form saves a name", async ({ page, context }) => {
  await addSessionCookie(context);
  await page.goto("/fr/dashboard/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Profil" })).toBeVisible();
  await page.locator("#firstName").fill("Ada");
  await page.locator("#lastName").fill("Lovelace");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré.")).toBeVisible();
});
