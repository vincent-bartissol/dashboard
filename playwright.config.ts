import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT ?? "3000";
const origin = `http://localhost:${port}`;

process.env.BETTER_AUTH_SECRET ??= "ci-placeholder-secret-32chars-minok";
process.env.BETTER_AUTH_URL ??= origin;
process.env.DATA_DIR ??= path.join(os.tmpdir(), "dashboard-e2e");
process.env.NEXT_TELEMETRY_DISABLED ??= "1";
process.env.PLAYWRIGHT_ORIGIN = origin;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.mjs",
  use: {
    baseURL: origin,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm start",
    url: `${origin}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      DATA_DIR: process.env.DATA_DIR,
      NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
      NODE_ENV: "production",
      HOSTNAME: "0.0.0.0",
      PORT: port,
    },
  },
});
