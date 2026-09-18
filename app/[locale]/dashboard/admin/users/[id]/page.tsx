import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AdminUserControls } from "@/components/admin/user-controls";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { isAdminUser } from "@/lib/admin";
import {
  adminRoleLabel,
  adminUserStatus,
  getProfile,
  getUserForAdmin,
  listActivityForUser,
  listFavorites,
  listSessionsForUser,
} from "@/lib/db/queries";
import { requireAdmin } from "@/lib/session";

function parseMetadata(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  const user = await getUserForAdmin(id);
  if (!user) notFound();

  const t = await getTranslations("Admin");
  const format = await getFormatter();
  const [profile, sessions, favorites, activities] = await Promise.all([
    getProfile(user.id),
    listSessionsForUser(user.id),
    listFavorites(user.id),
    listActivityForUser(user.id),
  ]);

  // Request-time boundary for “session still valid”.
  // eslint-disable-next-line react-hooks/purity -- server page, once per request
  const now = Date.now();
  const sessionRows = sessions.map((row) => {
    const expires = row.expiresAt instanceof Date ? row.expiresAt.getTime() : Number(row.expiresAt);
    return {
      ...row,
      live: expires > now,
      createdLabel: format.dateTime(new Date(row.createdAt), {
        dateStyle: "short",
        timeStyle: "short",
      }),
    };
  });

  const status = adminUserStatus(user);
  const roleKey = adminRoleLabel(user);
  const effectivelyBanned = status === "banned";

  return (
    <div className="space-y-6">
      <PageIntro title={user.name || user.email}>
        <Link href="/dashboard/admin" className="text-heading underline">
          {t("backToUsers")}
        </Link>
      </PageIntro>

      <AdminUserControls
        userId={user.id}
        role={user.role}
        banned={effectivelyBanned}
        isSelf={session.user.id === user.id}
        targetIsAdmin={isAdminUser(user)}
        sessions={sessionRows.map((row) => ({
          id: row.id,
          live: row.live,
          createdLabel: row.createdLabel,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
        }))}
      />

      <Card>
        <SectionTitle>{t("user.profile")}</SectionTitle>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("columns.email")}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("columns.role")}</dt>
            <dd>{t(`roles.${roleKey}`)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("columns.status")}</dt>
            <dd>{t(`status.${status}`)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("user.arrondissement")}</dt>
            <dd>{profile.arrondissement || "—"}</dd>
          </div>
          {effectivelyBanned && user.banReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">{t("user.banReason")}</dt>
              <dd>{user.banReason}</dd>
            </div>
          ) : null}
        </dl>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3">
          <SectionTitle>{t("user.sessions")}</SectionTitle>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="text-label border-b border-line bg-ground">
            <tr>
              <th className="px-3 py-2">{t("sessions.created")}</th>
              <th className="px-3 py-2">{t("sessions.expires")}</th>
              <th className="px-3 py-2">{t("sessions.ip")}</th>
              <th className="px-3 py-2">{t("sessions.ua")}</th>
              <th className="px-3 py-2">{t("sessions.live")}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted">
                  {t("sessions.empty")}
                </td>
              </tr>
            ) : null}
            {sessionRows.map((row) => (
              <tr key={row.id} className="border-b border-line/80 last:border-0">
                <td className="px-3 py-2 tabular-nums">{row.createdLabel}</td>
                <td className="px-3 py-2 tabular-nums">
                  {format.dateTime(new Date(row.expiresAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-3 py-2">{row.ipAddress || "—"}</td>
                <td className="max-w-xs truncate px-3 py-2" title={row.userAgent ?? undefined}>
                  {row.userAgent || "—"}
                </td>
                <td className="px-3 py-2">
                  {row.live ? t("sessions.yes") : t("sessions.no")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3">
          <SectionTitle>{t("user.favorites")}</SectionTitle>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="text-label border-b border-line bg-ground">
            <tr>
              <th className="px-3 py-2">{t("favorites.label")}</th>
              <th className="px-3 py-2">{t("favorites.dataset")}</th>
              <th className="px-3 py-2">{t("favorites.record")}</th>
              <th className="px-3 py-2">{t("favorites.created")}</th>
            </tr>
          </thead>
          <tbody>
            {favorites.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  {t("favorites.empty")}
                </td>
              </tr>
            ) : null}
            {favorites.map((row) => (
              <tr key={row.id} className="border-b border-line/80 last:border-0">
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2">{row.datasetId}</td>
                <td className="px-3 py-2">{row.recordId}</td>
                <td className="px-3 py-2 tabular-nums">
                  {format.dateTime(new Date(row.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto p-0">
        <div className="border-b border-line px-4 py-3">
          <SectionTitle>{t("user.activity")}</SectionTitle>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="text-label border-b border-line bg-ground">
            <tr>
              <th className="px-3 py-2">{t("activity.when")}</th>
              <th className="px-3 py-2">{t("activity.action")}</th>
              <th className="px-3 py-2">{t("activity.details")}</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-muted">
                  {t("activity.empty")}
                </td>
              </tr>
            ) : null}
            {activities.map((row) => {
              const meta = parseMetadata(row.metadata);
              return (
                <tr key={row.id} className="border-b border-line/80 last:border-0">
                  <td className="px-3 py-2 tabular-nums">
                    {format.dateTime(new Date(row.createdAt), {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2 text-muted">
                    {meta ? JSON.stringify(meta) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
