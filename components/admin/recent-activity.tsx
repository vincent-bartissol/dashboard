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
    <Card>
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>{t("recentActivity")}</SectionTitle>
        {query.isFetching ? (
          <span className="text-xs text-muted">{t("refreshing")}</span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.length === 0 ? (
          <li className="text-muted">{t("recentEmpty")}</li>
        ) : (
          rows.map((row) => {
            const actionLabel = isKnownActivityAction(row.action)
              ? t(`actions.${row.action}`)
              : row.action;
            const meta = parseActivityMetadata(row.metadata);
            return (
              <li
                key={row.id}
                className="flex justify-between gap-3 border-b border-line/60 py-1.5 last:border-0"
              >
                <span className="min-w-0">
                  <span className="font-medium text-heading">{actionLabel}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {row.userName || row.userEmail}
                  </span>
                  {meta ? (
                    <span className="mt-1 block">
                      <ActivityMetadataList meta={meta} empty={null} />
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {format.dateTime(new Date(row.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
