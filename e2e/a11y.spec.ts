import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addSessionCookie } from "./session";

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .exclude(".leaflet-container")
    .analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
}

test("landing has no serious axe violations", async ({ page }) => {
  await page.goto("/fr");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test("login has no serious axe violations", async ({ page }) => {
  await page.goto("/fr/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test("dashboard has no serious axe violations", async ({ page, context }) => {
  await addSessionCookie(context);
  await page.goto("/fr/dashboard");
  await expect(page.getByRole("heading", { level: 1, name: /Vue d.ensemble/ })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});
