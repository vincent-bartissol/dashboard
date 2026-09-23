export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function createRateLimiter(options: {
  max: number;
  windowMs: number;
  now?: () => number;
}) {
  const hits = new Map<string, number[]>();
  const clock = options.now ?? Date.now;

  return {
    check(key: string): RateLimitResult {
      const t = clock();
      const windowStart = t - options.windowMs;
      for (const [id, stamps] of hits) {
        const kept = stamps.filter((stamp) => stamp > windowStart);
        if (kept.length === 0) hits.delete(id);
        else hits.set(id, kept);
      }
      const recent = hits.get(key) ?? [];
      if (recent.length >= options.max) {
        const oldest = recent[0] ?? t;
        const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - t) / 1000));
        return { ok: false, retryAfterSec };
      }
      recent.push(t);
      hits.set(key, recent);
      return { ok: true };
    },
    size() {
      return hits.size;
    },
  };
}

export const opendataRecordsLimit = createRateLimiter({ max: 60, windowMs: 60_000 });
export const opendataThemeLimit = createRateLimiter({ max: 30, windowMs: 60_000 });
export const opendataSearchLimit = createRateLimiter({ max: 40, windowMs: 60_000 });
export const favoritesApiLimit = createRateLimiter({ max: 60, windowMs: 60_000 });
export const alertsApiLimit = createRateLimiter({ max: 30, windowMs: 60_000 });
export const adminActivityLimit = createRateLimiter({ max: 60, windowMs: 60_000 });
