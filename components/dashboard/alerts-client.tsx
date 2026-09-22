"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AlertRule = {
  id: string;
  datasetId: string;
  recordId: string;
  label: string;
  metric: string;
  threshold: number;
  enabled: boolean;
  lastTriggeredAt: string | Date | null;
  createdAt: string | Date;
};

const alertsKey = ["alerts"] as const;

async function fetchAlerts(): Promise<AlertRule[]> {
  const res = await fetch("/api/alerts");
  const data = (await res.json()) as { ok: boolean; rules?: AlertRule[] };
  if (!res.ok || !data.ok || !Array.isArray(data.rules)) throw new Error("alerts");
  return data.rules;
}

async function mutateAlert(body: Record<string, unknown>): Promise<AlertRule[]> {
  const res = await fetch("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; rules?: AlertRule[] };
  if (!res.ok || !data.ok || !Array.isArray(data.rules)) throw new Error("alerts");
  return data.rules;
}

export function AlertsClient({ initial }: { initial: AlertRule[] }) {
  const t = useTranslations("Pages.alerts");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: alertsKey,
    queryFn: fetchAlerts,
    initialData: initial,
    refetchInterval: 60_000,
  });

  const mutation = useMutation({
    mutationFn: mutateAlert,
    onSuccess: (rules) => queryClient.setQueryData(alertsKey, rules),
  });

  const rules = query.data ?? [];

  if (rules.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">{t("empty")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const last = rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt) : null;
        return (
          <Card key={rule.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-heading">{rule.label}</p>
              <p className="text-sm text-muted">
                {t("threshold")}: {format.number(rule.threshold)} ·{" "}
                {rule.enabled ? t("enabled") : t("disabled")}
              </p>
              <p className="text-xs text-muted">
                {t("lastTriggered")}:{" "}
                {last
                  ? format.dateTime(last, { dateStyle: "short", timeStyle: "short" })
                  : t("never")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    action: rule.enabled ? "disable" : "enable",
                    id: rule.id,
                  })
                }
              >
                {rule.enabled ? t("disabled") : t("enabled")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ action: "delete", id: rule.id })}
              >
                {t("delete")}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
