export function isoDateDaysAgo(days: number, nowMs = Date.now()) {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
