export type SortDir = "asc" | "desc";

function isEmpty(value: unknown) {
  return value == null || value === "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Reject bare ISO-ish dates so they stay lexicographic when both sides are dates.
  if (/^\d{4}-\d{2}/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

function asText(value: unknown) {
  if (isEmpty(value)) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Compare two cell values for table sorting. Empty values sort last. */
export function compareCellValues(a: unknown, b: unknown, dir: SortDir = "asc") {
  const aEmpty = isEmpty(a);
  const bEmpty = isEmpty(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const aNum = asNumber(a);
  const bNum = asNumber(b);
  let result: number;
  if (aNum != null && bNum != null) {
    result = aNum - bNum;
  } else {
    result = asText(a).localeCompare(asText(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  return dir === "desc" ? -result : result;
}

export function sortByKey<T>(
  rows: T[],
  key: keyof T | null,
  dir: SortDir,
  getValue: (row: T, key: keyof T) => unknown = (row, k) => row[k],
) {
  if (!key) return rows;
  return [...rows].sort((a, b) => compareCellValues(getValue(a, key), getValue(b, key), dir));
}
