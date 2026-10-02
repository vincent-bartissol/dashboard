import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AdminUserTable } from "@/components/admin/user-table";
import { AdminRecentActivity } from "@/components/admin/recent-activity";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import {
  ADMIN_USERS_PAGE_SIZE,
  adminRoleLabel,
  adminUserStatus,
  getAdminStats,
  listRecentActivity,
  listUsersForAdmin,
} from "@/lib/db/queries";
import { firstSearchParam } from "@/lib/safe-next";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  await requireAdmin();
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const params = await searchParams;
  const search = firstSearchParam(params.q)?.trim() ?? "";
  const pageRaw = Number(firstSearchParam(params.page) ?? 1);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const offset = (page - 1) * ADMIN_USERS_PAGE_SIZE;

  const [listed, stats, recent] = await Promise.all([
    listUsersForAdmin({ search, limit: ADMIN_USERS_PAGE_SIZE, offset }),
    getAdminStats(),
    listRecentActivity(40),
  ]);

  const totalPages = Math.max(1, Math.ceil(listed.total / ADMIN_USERS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows =
    currentPage === page
      ? listed.rows
      : (
          await listUsersForAdmin({
            search,
            limit: ADMIN_USERS_PAGE_SIZE,
            offset: (currentPage - 1) * ADMIN_USERS_PAGE_SIZE,
          })
        ).rows;

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

  return (
    <div className="space-y-6">
      <div>
        <PageIntro title={t("title")}>{t("body")}</PageIntro>
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
          {
            label: t("stats.sessions"),
            value: format.number(stats.activeSessions),
            hint: t("stats.signupsWeek", { count: format.number(stats.signupsLast7Days) }),
          },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>{t("stats.topFavorites")}</SectionTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topFavorites.length === 0 ? (
              <li className="text-muted">{t("favorites.empty")}</li>
            ) : null}
            {stats.topFavorites.map((row) => (
              <li
                key={`${row.datasetId}:${row.recordId}`}
                className="flex justify-between gap-3 border-b border-line/60 py-1.5 last:border-0"
              >
                <span className="min-w-0 truncate">
                  {row.label}
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {row.datasetId}
                    {row.recordId ? ` · ${row.recordId}` : null}
                  </span>
                </span>
                <span className="tabular-nums text-heading">{format.number(row.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <SectionTitle>{t("stats.topPaths")}</SectionTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {stats.topPaths.length === 0 ? (
              <li className="text-muted">{t("activity.empty")}</li>
            ) : null}
            {stats.topPaths.map((row) => (
              <li
                key={row.path}
                className="flex justify-between gap-3 border-b border-line/60 py-1.5 last:border-0"
              >
                <span className="min-w-0 truncate font-mono text-xs">{row.path}</span>
                <span className="tabular-nums text-heading">{format.number(row.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <AdminRecentActivity
        initial={recent.map((row) => ({
          id: row.id,
          action: row.action,
          metadata: row.metadata,
          createdAt: row.createdAt,
          userName: row.userName,
          userEmail: row.userEmail,
        }))}
      />
      <AdminUserTable
        users={userRows}
        search={search}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
