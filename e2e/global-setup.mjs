import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const authDir = path.join(process.cwd(), "e2e", ".auth");
const sessionPath = path.join(authDir, "session");

export default async function globalSetup() {
  const origin =
    process.env.PLAYWRIGHT_ORIGIN || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const cookie = execFileSync(process.execPath, ["scripts/lighthouse-seed.mjs"], {
    encoding: "utf8",
    env: process.env,
  }).trim();
  if (!cookie) {
    throw new Error("lighthouse-seed.mjs did not print a session cookie");
  }
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(sessionPath, cookie);
  fs.writeFileSync(path.join(authDir, "origin"), origin);

  const res = await fetch(`${origin}/fr/dashboard`, {
    headers: { Cookie: `better-auth.session_token=${cookie}` },
    redirect: "manual",
  });
  if (res.status !== 200) {
    throw new Error(`Seeded session did not open /fr/dashboard (HTTP ${res.status})`);
  }
}
