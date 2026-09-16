import { expect, test } from "@playwright/test";

test("login shows an error for bad credentials", async ({ page }) => {
  await page.goto("/fr/login");
  await page.locator("#email").fill("nobody@example.com");
  await page.locator("#password").fill("wrong-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.locator("p[role='alert']")).toHaveText(
    "E-mail ou mot de passe incorrect.",
  );
});
