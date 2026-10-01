/**
 * Best-effort ping to healthchecks.io. Failures never affect the caller status.
 */
export async function pingHealthchecks(ok: boolean) {
  const base = process.env.HEALTHCHECKS_PING_URL?.trim();
  if (!base) return;

  const url = ok ? base : `${base.replace(/\/$/, "")}/fail`;
  try {
    await fetch(url, { method: "GET", cache: "no-store", signal: AbortSignal.timeout(5000) });
  } catch {
    // Ignore: cron response must not depend on the dead-man's switch.
  }
}
