/**
 * Node-only New Relic bootstrap. Loaded from instrumentation.ts when
 * NEXT_RUNTIME === "nodejs" so the Edge instrumentation bundle never sees it.
 *
 * Uses createRequire + a non-literal module id so Turbopack does not try to
 * statically trace newrelic's package graph (README.md / security-agent).
 */
export async function registerNewRelic() {
  if (!process.env.NEW_RELIC_LICENSE_KEY?.trim()) return;

  process.env.NEW_RELIC_NO_CONFIG_FILE ??= "true";
  process.env.NEW_RELIC_APP_NAME ??= "paris-ouverte";
  process.env.NEW_RELIC_OPENTELEMETRY_ENABLED ??= "true";
  process.env.NEW_RELIC_INSTRUMENTATION_NEXT_ENABLED ??= "false";
  process.env.NEW_RELIC_INSTRUMENTATION_HTTP_ENABLED ??= "false";
  process.env.NEW_RELIC_INSTRUMENTATION_UNDICI_ENABLED ??= "false";

  const { createRequire } = await import("node:module");
  const { fileURLToPath } = await import("node:url");
  const require = createRequire(fileURLToPath(import.meta.url));
  const id = ["new", "relic"].join("");
  require(id);
}
