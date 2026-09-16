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
      const recent = (hits.get(key) ?? []).filter((stamp) => stamp > windowStart);
      if (recent.length >= options.max) {
        hits.set(key, recent);
        const oldest = recent[0] ?? t;
        const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - t) / 1000));
        return { ok: false, retryAfterSec };
      }
      recent.push(t);
      hits.set(key, recent);
      return { ok: true };
    },
  };
}

export const opendataRecordsLimit = createRateLimiter({ max: 60, windowMs: 60_000 });
