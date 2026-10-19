"use client";

import { useMemo } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AdminUserTable } from "@/components/admin/user-table";
import { AdminRecentActivity } from "@/components/admin/recent-activity";
import { useDemo } from "@/components/demo/demo-provider";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntroClient } from "@/components/dashboard/page-intro-client";
import { adminRoleLabel, adminUserStatus } from "@/lib/demo/admin-labels";
import { createSeedUsers } from "@/lib/demo/seed";

const PAGE_SIZE = 20;

export function AdminHomeClient() {
  const t = useTranslations("Admin");
  const format = useFormatter();
  const searchParams = useSearchParams();
  const search = searchParams.get("q")?.trim() ?? "";
  const pageRaw = Number(searchParams.get("page") ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const { state } = useDemo();
  const users = state.users.length > 0 ? state.users : createSeedUsers();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? users.filter(
          (user) =>
            user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
        )
      : users;
  }, [search, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const userRows = pageRows.map((row) => {
    const status = adminUserStatus(row);
    const roleKey = adminRoleLabel(row);
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      emailVerified: row.emailVerified,
      roleLabel: t(`roles.${roleKey}`),
      statusLabel: t(`status.${status}`),
      createdLabel: format.dateTime(new Date(row.createdAt), {
        dateStyle: "short",
        timeStyle: "short",
      }),
    };
  });

  const stats = {
    users: users.length,
    verified: users.filter((user) => user.emailVerified).length,
    banned: users.filter((user) => user.banned).length,
    sessions: state.session ? 1 : 0,
  };

  const recent = (state.activity.length ? state.activity : []).slice(0, 40).map((row) => {
    const user = users.find((item) => item.id === row.userId);
    return {
      id: row.id,
      action: row.action,
      metadata: row.metadata,
      createdAt: row.createdAt,
      userName: user?.name ?? row.userId,
      userEmail: user?.email ?? "",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <PageIntroClient title={t("title")}>{t("body")}</PageIntroClient>
        <p className="-mt-4">
          <Link
            href="/dashboard/admin/messages"
            className="text-sm font-medium text-heading hover:underline"
          >
            {t("messagesLink")}
          </Link>
        </p>
      </div>
      <KpiStrip
        items={[
          { label: t("stats.users"), value: format.number(stats.users) },
          { label: t("stats.verified"), value: format.number(stats.verified) },
          { label: t("stats.banned"), value: format.number(stats.banned) },
          { label: t("stats.sessions"), value: format.number(stats.sessions) },
        ]}
      />
      <AdminRecentActivity items={recent} />
      <AdminUserTable
        users={userRows}
        search={search}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
