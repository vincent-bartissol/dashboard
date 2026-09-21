"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { compareCellValues, type SortDir } from "@/lib/opendata/sort";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roleLabel: string;
  statusLabel: string;
  createdLabel: string;
};

type SortKey = "name" | "email" | "roleLabel" | "statusLabel" | "createdLabel";

const COLUMNS: { key: SortKey; labelKey: "name" | "email" | "role" | "status" | "created" }[] = [
  { key: "name", labelKey: "name" },
  { key: "email", labelKey: "email" },
  { key: "roleLabel", labelKey: "role" },
  { key: "statusLabel", labelKey: "status" },
  { key: "createdLabel", labelKey: "created" },
];

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations("Admin");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.roleLabel.toLowerCase().includes(q) ||
        user.statusLabel.toLowerCase().includes(q),
    );
  }, [users, query]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => compareCellValues(a[sortKey], b[sortKey], sortDir));
  }, [filtered, sortDir, sortKey]);

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <Card className="overflow-x-auto p-0">
      <div className="border-b border-line p-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchUsers")}
          aria-label={t("searchUsers")}
        />
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="text-label border-b border-line bg-ground">
          <tr>
            {COLUMNS.map((column) => {
              const label = t(`columns.${column.labelKey}`);
              const active = sortKey === column.key;
              const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";
              return (
                <th
                  key={column.key}
                  className="px-3 py-2"
                  aria-sort={
                    active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  <button
                    type="button"
                    onClick={() => onSort(column.key)}
                    className="inline-flex items-center gap-1 focus-field hover:text-heading"
                    aria-label={
                      nextDir === "asc"
                        ? t("sortAsc", { column: label })
                        : t("sortDesc", { column: label })
                    }
                  >
                    {label}
                    {active ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      )
                    ) : null}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted">
                {t("noUsers")}
              </td>
            </tr>
          ) : null}
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-line/80 last:border-0">
              <td className="px-3 py-2">
                <Link
                  href={`/dashboard/admin/users/${row.id}`}
                  className="font-medium text-heading underline-offset-2 hover:underline"
                >
                  {row.name || "—"}
                </Link>
              </td>
              <td className="px-3 py-2">{row.email}</td>
              <td className="px-3 py-2">{row.roleLabel}</td>
              <td className="px-3 py-2">{row.statusLabel}</td>
              <td className="px-3 py-2 tabular-nums">{row.createdLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
