import type { DatasetConfig, OpenDataRecord } from "./client";

export function cellSearchText(value: unknown) {
  if (value == null || value === "") return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function recordMatchesQuery(
  record: OpenDataRecord,
  columns: DatasetConfig["columns"],
  query: string,
) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return columns.some((column) => cellSearchText(record[column.key]).toLowerCase().includes(needle));
}
