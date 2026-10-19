import type { BrowserContext, Page } from "@playwright/test";
import { DEMO_ADMIN, DEMO_VISITOR, createSeedUsers } from "../lib/demo/seed";

const STORAGE_KEY = "paris-ouverte-demo-v1";

function demoState(role: "user" | "admin") {
  const user = role === "admin" ? DEMO_ADMIN : DEMO_VISITOR;
  return {
    session: {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    users: createSeedUsers(),
    favorites: [],
    activity: [],
    pendingEmail: null,
  };
}

/** Seed a demo session in localStorage (static export has no auth cookies). */
export async function seedDemoSession(
  page: Page,
  role: "user" | "admin" = "user",
) {
  await page.addInitScript(
    ({ key, state }) => {
      window.localStorage.setItem(key, JSON.stringify(state));
    },
    { key: STORAGE_KEY, state: demoState(role) },
  );
}

/** @deprecated Prefer seedDemoSession — kept so older imports keep typechecking during the rewrite. */
export async function addSessionCookie(
  context: BrowserContext,
  page?: Page,
  role: "user" | "admin" = "user",
) {
  void context;
  if (page) await seedDemoSession(page, role);
}
