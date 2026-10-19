"use client";

import { useFormatter, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AdminUserControls } from "@/components/admin/user-controls";
import { useDemo } from "@/components/demo/demo-provider";
import { PageIntroClient } from "@/components/dashboard/page-intro-client";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { adminRoleLabel, adminUserStatus } from "@/lib/demo/admin-labels";
import { createSeedUsers } from "@/lib/demo/seed";

export function AdminUserDetailClient({ userId }: Readonly<{ userId: string }>) {
  const t = useTranslations("Admin");
  const format = useFormatter();
  const { state, session, ready } = useDemo();
  const users = state.users.length > 0 ? state.users : createSeedUsers();
  const user = users.find((row) => row.id === userId) ?? createSeedUsers().find((row) => row.id === userId);
  if (!user) {
    if (!ready) return null;
    notFound();
  }

  const status = adminUserStatus(user);
  const roleKey = adminRoleLabel(user);
  const isSelf = session?.userId === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/admin" className="text-sm font-medium text-heading hover:underline">
          {t("backToUsers")}
        </Link>
        <PageIntroClient title={user.name}>{user.email}</PageIntroClient>
      </div>
      <Card className="space-y-2 p-4 text-sm">
        <SectionTitle>{t("user.profile")}</SectionTitle>
        <p>
          {t("columns.role")}: {t(`roles.${roleKey}`)}
        </p>
        <p>
          {t("columns.status")}: {t(`status.${status}`)}
        </p>
        <p>
          {t("user.arrondissement")}: {user.arrondissement ?? "—"}
        </p>
        {user.banReason ? (
          <p>
            {t("user.banReason")}: {user.banReason}
          </p>
        ) : null}
        <p>
          {t("columns.created")}:{" "}
          {format.dateTime(new Date(user.createdAt), {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      </Card>
      <AdminUserControls
        userId={user.id}
        role={user.role}
        banned={user.banned}
        isSelf={isSelf}
        targetIsAdmin={user.role === "admin"}
        sessions={[
          {
            id: `demo-session-${user.id}`,
            live: true,
            createdLabel: format.dateTime(new Date(user.createdAt), {
              dateStyle: "short",
              timeStyle: "short",
            }),
            ipAddress: "192.0.2.10",
            userAgent: "Demo Browser",
          },
        ]}
      />
    </div>
  );
}
