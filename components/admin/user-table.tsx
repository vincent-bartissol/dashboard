"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { compareCellValues, type SortDir } from "@/lib/opendata/sort";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roleKey: "admin" | "adminBreakGlass" | "user";
  roleLabel: string;
  statusKey: "banned" | "active" | "unverified";
  statusLabel: string;
  createdLabel: string;
};

type SortKey = "name" | "email" | "roleLabel" | "statusLabel" | "createdLabel";

const PAGE_SIZE = 10;

const COLUMNS: { key: SortKey; labelKey: "name" | "email" | "role" | "status" | "created" }[] = [
  { key: "name", labelKey: "name" },
  { key: "email", labelKey: "email" },
  { key: "roleLabel", labelKey: "role" },
  { key: "statusLabel", labelKey: "status" },
  { key: "createdLabel", labelKey: "created" },
];

function roleBadgeVariant(roleKey: AdminUserRow["roleKey"]) {
  if (roleKey === "admin" || roleKey === "adminBreakGlass") return "secondary" as const;
  return "outline" as const;
}

function statusBadgeVariant(statusKey: AdminUserRow["statusKey"]) {
  if (statusKey === "banned") return "destructive" as const;
  if (statusKey === "active") return "default" as const;
  return "ghost" as const;
}

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations("Admin");
  const [query, setQuery] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
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

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const pageRows = sorted.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPageIndex(0);
  }

  return (
    <Card className="overflow-x-auto p-0">
      <div className="border-b border-line p-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPageIndex(0);
          }}
          placeholder={t("searchUsers")}
          aria-label={t("searchUsers")}
        />
      </div>
      <Table>
        <TableHeader className="bg-ground">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((column) => {
              const label = t(`columns.${column.labelKey}`);
              const active = sortKey === column.key;
              const nextDir: SortDir = active && sortDir === "asc" ? "desc" : "asc";
              return (
                <TableHead
                  key={column.key}
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
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="px-3 py-6 text-center text-muted">
                {t("noUsers")}
              </TableCell>
            </TableRow>
          ) : null}
          {pageRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/dashboard/admin/users/${row.id}`}
                  className="font-medium text-heading underline-offset-2 hover:underline"
                >
                  {row.name || "—"}
                </Link>
              </TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>
                <Badge variant={roleBadgeVariant(row.roleKey)}>{row.roleLabel}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant(row.statusKey)}>{row.statusLabel}</Badge>
              </TableCell>
              <TableCell className="tabular-nums">{row.createdLabel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-sm text-muted">
          {t("page", { current: currentPage + 1, count: pageCount })}
        </p>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text={t("previous")}
                disabled={currentPage === 0}
                onClick={() => setPageIndex(currentPage - 1)}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                text={t("next")}
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPageIndex(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </Card>
  );
}
