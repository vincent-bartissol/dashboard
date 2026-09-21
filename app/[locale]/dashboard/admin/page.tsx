import { getFormatter, getTranslations } from "next-intl/server";
import { AdminUserTable } from "@/components/admin/user-table";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import {
  adminRoleLabel,
  adminUserStatus,
  getAdminStats,
  listUsersForAdmin,
} from "@/lib/db/queries";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  await requireAdmin();
  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const [users, stats] = await Promise.all([listUsersForAdmin(), getAdminStats()]);

  const userRows = users.map((row) => {
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
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
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
      <AdminUserTable users={userRows} />
    </div>
  );
}
