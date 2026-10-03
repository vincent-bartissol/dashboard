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

function adminHref(search: string, page: number) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard/admin?${query}` : "/dashboard/admin";
}

export function AdminUserTable({
  users,
  search = "",
  page = 1,
  totalPages = 1,
}: {
  users: AdminUserRow[];
  search?: string;
  page?: number;
  totalPages?: number;
}) {
  const t = useTranslations("Admin");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return users;
    return [...users].sort((a, b) => compareCellValues(a[sortKey], b[sortKey], sortDir));
  }, [users, sortDir, sortKey]);

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
        <form method="get">
          <Input
            type="search"
            name="q"
            defaultValue={search}
            placeholder={t("searchUsers")}
            aria-label={t("searchUsers")}
          />
        </form>
      </div>
      <table className="min-w-full text-left text-sm">
        <thead className="table-head">
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
            <tr key={row.id} className="table-row">
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
      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-3 text-sm">
          <p className="text-muted">
            {t("pageIndicator", { current: page, total: totalPages })}
          </p>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link
                href={adminHref(search, page - 1)}
                className="font-medium text-heading hover:underline"
              >
                {t("previousPage")}
              </Link>
            ) : (
              <span className="text-muted">{t("previousPage")}</span>
            )}
            {page < totalPages ? (
              <Link
                href={adminHref(search, page + 1)}
                className="font-medium text-heading hover:underline"
              >
                {t("nextPage")}
              </Link>
            ) : (
              <span className="text-muted">{t("nextPage")}</span>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
