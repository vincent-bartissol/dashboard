import fs from "node:fs";
import path from "node:path";
import type { BrowserContext } from "@playwright/test";

const sessionPath = path.join(process.cwd(), "e2e", ".auth", "session");

export function sessionCookieValue() {
  return fs.readFileSync(sessionPath, "utf8").trim();
}

export async function addSessionCookie(context: BrowserContext) {
  const value = sessionCookieValue();
  const origin =
    fs.readFileSync(path.join(path.dirname(sessionPath), "origin"), "utf8").trim() ||
    process.env.PLAYWRIGHT_ORIGIN ||
    "http://localhost:3000";
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value,
      url: origin,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await context.setExtraHTTPHeaders({
    Cookie: `better-auth.session_token=${value}`,
  });
}
