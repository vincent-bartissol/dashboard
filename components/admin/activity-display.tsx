import type { ReactNode } from "react";

const KNOWN_ACTIONS = [
  "signup",
  "login",
  "favorite.add",
  "favorite.remove",
  "profile.update",
  "page.view",
  "admin.ban",
  "admin.unban",
  "admin.setRole",
  "admin.revokeSession",
] as const;

export type KnownActivityAction = (typeof KNOWN_ACTIONS)[number];

export function isKnownActivityAction(action: string): action is KnownActivityAction {
  return (KNOWN_ACTIONS as readonly string[]).includes(action);
}

export function parseActivityMetadata(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function ActivityMetadataList({
  meta,
  empty = "—",
}: {
  meta: Record<string, unknown> | null;
  empty?: ReactNode;
}) {
  if (!meta || Object.keys(meta).length === 0) {
    return <>{empty}</>;
  }
  return (
    <dl className="grid gap-1 text-xs">
      {Object.entries(meta).map(([key, value]) => (
        <div key={key} className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt className="font-medium text-heading">{key}</dt>
          <dd className="truncate text-muted">
            {value == null || value === ""
              ? "—"
              : typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                ? String(value)
                : JSON.stringify(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
