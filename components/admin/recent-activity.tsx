"use client";

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
  metadata?: string | null;
  createdAt: string | Date;
  userName: string;
  userEmail: string;
};

export function AdminRecentActivity({
  items,
  initial,
}: Readonly<{ items?: ActivityRow[]; initial?: ActivityRow[] }>) {
  const t = useTranslations("Admin");
  const format = useFormatter();
  const rows = items ?? initial ?? [];

  return (
    <Card>
      <SectionTitle>{t("recentActivity")}</SectionTitle>
      <ul className="mt-3 space-y-3 text-sm">
        {rows.length === 0 ? <li className="text-muted">{t("recentEmpty")}</li> : null}
        {rows.map((row) => {
          const actionLabel = isKnownActivityAction(row.action) ? row.action : row.action;
          const meta = parseActivityMetadata(row.metadata ?? null);
          return (
            <li key={row.id} className="border-b border-line/60 pb-2 last:border-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-heading">{actionLabel}</span>
                <span className="text-xs text-muted">
                  {format.dateTime(new Date(row.createdAt), {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <p className="text-muted">
                {row.userName}
                {row.userEmail ? ` · ${row.userEmail}` : null}
              </p>
              {meta ? <ActivityMetadataList meta={meta} /> : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
