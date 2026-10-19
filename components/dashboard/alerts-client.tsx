"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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

export function AlertsClient({
  initial,
}: Readonly<{ initial: AlertRule[] }>) {
  const t = useTranslations("Pages.alerts");
  const [rules] = useState(initial);

  if (rules.length === 0) {
    return (
      <Card>
        <p className="text-sm text-muted">{t("empty")}</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Card className="text-sm">
            <p className="font-medium text-heading">{rule.label}</p>
            <p className="text-muted">
              {rule.metric} ≤ {rule.threshold}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
