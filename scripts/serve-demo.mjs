import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(process.cwd(), ".demo-serve");
const target = join(root, "dashboard");
const port = process.env.PORT ?? "3000";

rmSync(root, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(join(process.cwd(), "out"), target, { recursive: true });

const result = spawnSync(
  "npx",
  ["--yes", "serve", root, "-p", port],
  { stdio: "inherit", shell: false },
);
process.exit(result.status ?? 1);
