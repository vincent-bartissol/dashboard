/**
 * Copy newrelic's pnpm dependency closure into the Next standalone output.
 *
 * The agent is loaded with a non-literal require so Turbopack does not trace
 * it. outputFileTracingIncludes only copies the newrelic package itself, and
 * pnpm keeps dependencies as siblings under node_modules/.pnpm. Without this
 * step, require("newrelic") crashes the server (missing json-stringify-safe).
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceNm = path.join(root, "node_modules");
const destNm =
  process.env.NEWRELIC_STANDALONE_NM ??
  path.join(root, ".next", "standalone", "node_modules");

const entry = path.join(sourceNm, "newrelic");
if (!fs.existsSync(entry)) {
  console.log("copy-newrelic-standalone: newrelic is not installed, skipping");
  process.exit(0);
}
if (!fs.existsSync(path.dirname(destNm))) {
  console.log("copy-newrelic-standalone: standalone output missing, skipping");
  process.exit(0);
}

const projectNm = path.resolve(sourceNm);
const seen = new Set();
const queue = [];

function enqueue(candidate) {
  let real;
  try {
    real = fs.realpathSync(candidate);
  } catch {
    return;
  }
  if (seen.has(real)) return;
  if (!fs.existsSync(path.join(real, "package.json"))) return;
  seen.add(real);
  queue.push(real);
}

function dependencyFolder(pkgReal) {
  let dir = path.dirname(pkgReal);
  while (dir !== path.dirname(dir)) {
    if (path.basename(dir) === "node_modules") return dir;
    dir = path.dirname(dir);
  }
  return null;
}

function enqueueSiblingDeps(pkgReal) {
  const folder = dependencyFolder(pkgReal);
  if (!folder || path.resolve(folder) === projectNm) return;

  let entries;
  try {
    entries = fs.readdirSync(folder, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(folder, entry.name);
    // pnpm dependency entries are symlinks. Dirent.isDirectory() is false for those.
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;

    if (entry.name.startsWith("@") && !fs.existsSync(path.join(full, "package.json"))) {
      let scoped;
      try {
        scoped = fs.readdirSync(full);
      } catch {
        continue;
      }
      for (const name of scoped) enqueue(path.join(full, name));
      continue;
    }

    enqueue(full);
  }
}

enqueue(entry);
for (let index = 0; index < queue.length; index += 1) {
  enqueueSiblingDeps(queue[index]);
}

fs.mkdirSync(destNm, { recursive: true });

let copied = 0;
for (const real of queue) {
  const pkg = JSON.parse(fs.readFileSync(path.join(real, "package.json"), "utf8"));
  if (typeof pkg.name !== "string" || pkg.name.length === 0) continue;

  const dest = path.join(destNm, ...pkg.name.split("/"));
  if (fs.existsSync(dest)) continue;

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(real, dest, {
    recursive: true,
    dereference: true,
    filter: (src) => path.basename(src) !== "node_modules",
  });
  copied += 1;
}

console.log(`copy-newrelic-standalone: copied ${copied} packages`);
