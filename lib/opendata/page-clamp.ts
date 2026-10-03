/** Explore API offset ceiling — keep paginated requests inside the upstream bound. */
export const MAX_OFFSET = 10_000;

export function clampPageLimit(
  value: number | undefined,
  defaults: { size: number; max: number },
) {
  if (value == null || !Number.isFinite(value)) return defaults.size;
  return Math.min(defaults.max, Math.max(1, Math.floor(value)));
}

export function clampPageOffset(value: number | undefined) {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(MAX_OFFSET, Math.floor(value));
}

/** Parse a query-string limit, falling back to `defaults.size`. */
export function clampLimitParam(
  raw: string | null,
  defaults: { size: number; max: number },
) {
  return clampPageLimit(raw == null ? undefined : Number(raw), defaults);
}

/** Parse a query-string offset, defaulting to 0. */
export function clampOffsetParam(raw: string | null) {
  return clampPageOffset(raw == null ? undefined : Number(raw));
}
