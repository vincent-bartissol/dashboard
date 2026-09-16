import fs from "node:fs";
import path from "node:path";

const CATEGORIES = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["best-practices", "Best Practices"],
  ["seo", "SEO"],
];

const reportsDir = path.resolve(".lighthouseci");

function median(values) {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function formatScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}

function isLhr(data) {
  return Boolean(data && typeof data === "object" && data.categories && data.lighthouseVersion);
}

function reportUrl(data) {
  return data.finalRequestedUrl || data.requestedUrl || data.finalUrl || "unknown";
}

function categoryScore(data, id) {
  const score = data.categories?.[id]?.score;
  return typeof score === "number" ? score : null;
}

function loadReports() {
  if (!fs.existsSync(reportsDir)) return [];
  const files = fs.readdirSync(reportsDir).filter((name) => name.endsWith(".json") && name !== "manifest.json");
  const reports = [];
  for (const name of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(reportsDir, name), "utf8"));
      if (isLhr(data)) reports.push(data);
    } catch {
      // skip malformed dumps
    }
  }
  return reports;
}

function summarize(reports) {
  /** @type {Map<string, Record<string, number[]>>} */
  const byUrl = new Map();
  for (const report of reports) {
    const url = reportUrl(report);
    const row = byUrl.get(url) ?? Object.fromEntries(CATEGORIES.map(([id]) => [id, []]));
    for (const [id] of CATEGORIES) {
      const score = categoryScore(report, id);
      if (score !== null) row[id].push(score);
    }
    byUrl.set(url, row);
  }
  return [...byUrl.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const reports = loadReports();
if (reports.length === 0) {
  const empty = "### Lighthouse (median)\n\nNo Lighthouse JSON reports in `.lighthouseci`.\n";
  process.stdout.write(empty);
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, empty);
  }
  process.exit(0);
}

const rows = summarize(reports);
const lines = [
  "### Lighthouse (median)",
  "",
  `| URL | ${CATEGORIES.map(([, label]) => label).join(" | ")} |`,
  `| --- | ${CATEGORIES.map(() => "---").join(" | ")} |`,
  ...rows.map(([url, scores]) => {
    const cells = CATEGORIES.map(([id]) => formatScore(median(scores[id])));
    return `| ${url} | ${cells.join(" | ")} |`;
  }),
  "",
];
const markdown = `${lines.join("\n")}\n`;
process.stdout.write(markdown);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
}
