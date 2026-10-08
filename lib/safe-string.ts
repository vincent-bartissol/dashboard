/** Read a FormData field only when it is a string (never stringify File/Blob). */
export function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

/** Stringify scalars only; objects/symbols/functions become "". */
export function scalarString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  return "";
}
