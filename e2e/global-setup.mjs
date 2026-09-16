import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const authDir = path.join(process.cwd(), "e2e", ".auth");
const sessionPath = path.join(authDir, "session");

export default function globalSetup() {
  const origin =
    process.env.PLAYWRIGHT_ORIGIN || process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const cookie = execFileSync("node", ["scripts/lighthouse-seed.mjs"], {
    encoding: "utf8",
    env: process.env,
  }).trim();
  if (!cookie) {
    throw new Error("lighthouse-seed.mjs did not print a session cookie");
  }
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(sessionPath, cookie);
  fs.writeFileSync(path.join(authDir, "origin"), origin);

  const status = execFileSync(
    "curl",
    [
      "-s",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "-H",
      `Cookie: better-auth.session_token=${cookie}`,
      `${origin}/fr/dashboard`,
    ],
    { encoding: "utf8" },
  ).trim();
  if (status !== "200") {
    throw new Error(`Seeded session did not open /fr/dashboard (HTTP ${status})`);
  }
}
