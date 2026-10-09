"use client";

import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import {
  ActivityMetadataList,
  isKnownActivityAction,
  parseActivityMetadata,
} from "@/components/admin/activity-display";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";

type ActivityRow = {
  id: string;
  action: string;
  metadata: string | null;
  createdAt: string | Date;
  userName: string;
  userEmail: string;
};

async function fetchActivity(): Promise<ActivityRow[]> {
  const res = await fetch("/api/admin/activity");
  const data = (await res.json()) as { ok: boolean; activity?: ActivityRow[] };
  if (!res.ok || !data.ok || !Array.isArray(data.activity)) throw new Error("activity");
  return data.activity;
}

export function AdminRecentActivity({
  initial,
}: Readonly<{ initial: ActivityRow[] }>) {
  const t = useTranslations("Admin");
  const format = useFormatter();
  const query = useQuery({
    queryKey: ["admin-activity"],
    queryFn: fetchActivity,
    initialData: initial,
    refetchInterval: 15_000,
  });

  const rows = query.data ?? [];

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <SectionTitle>{t("recentActivity")}</SectionTitle>
        {query.isFetching ? (
          <span className="text-xs text-muted">{t("refreshing")}</span>
        ) : null}
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2">{t("activityColumns.action")}</th>
              <th className="px-3 py-2">{t("activityColumns.user")}</th>
              <th className="px-3 py-2">{t("activityColumns.details")}</th>
              <th className="px-3 py-2">{t("activityColumns.when")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted">
                  {t("recentEmpty")}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const actionLabel = isKnownActivityAction(row.action)
                  ? t(`actions.${row.action}`)
                  : row.action;
                const meta = parseActivityMetadata(row.metadata);
                return (
                  <tr key={row.id} className="table-row">
                    <td className="px-3 py-2 font-medium text-heading">{actionLabel}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-muted">
                      {row.userName || row.userEmail}
                    </td>
                    <td className="px-3 py-2">
                      <ActivityMetadataList meta={meta} empty="—" />
                    </td>
                    <td className="shrink-0 px-3 py-2 text-xs tabular-nums text-muted">
                      {format.dateTime(new Date(row.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
