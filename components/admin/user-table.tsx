"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  createdLabel: string;
};

export function AdminUserTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations("Admin");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q),
    );
  }, [users, query]);

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
            <th className="px-3 py-2">{t("columns.name")}</th>
            <th className="px-3 py-2">{t("columns.email")}</th>
            <th className="px-3 py-2">{t("columns.role")}</th>
            <th className="px-3 py-2">{t("columns.status")}</th>
            <th className="px-3 py-2">{t("columns.created")}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-muted">
                {t("noUsers")}
              </td>
            </tr>
          ) : null}
          {filtered.map((row) => (
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
              <td className="px-3 py-2">{row.role}</td>
              <td className="px-3 py-2">
                {row.banned
                  ? t("status.banned")
                  : row.emailVerified
                    ? t("status.active")
                    : t("status.unverified")}
              </td>
              <td className="px-3 py-2 tabular-nums">{row.createdLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
