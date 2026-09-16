"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpenDataRecord } from "@/lib/opendata/client";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { useChartChrome } from "@/components/theme/use-chart-chrome";

export function BikeCountChart({ records }: { records: OpenDataRecord[] }) {
  const chrome = useChartChrome();
  const t = useTranslations("Charts");
  const summaryId = useId();
  const byDay = new Map<string, number>();
  for (const row of records) {
    const raw = String(row.date ?? "");
    const day = raw.slice(0, 10);
    if (!day) continue;
    byDay.set(day, (byDay.get(day) ?? 0) + Number(row.total ?? 0));
  }
  const data = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, total]) => ({ day, total }));
  const from = data[0]?.day ?? "—";
  const to = data[data.length - 1]?.day ?? "—";
  const peak = data.reduce((max, row) => Math.max(max, row.total), 0);

  return (
    <Card>
      <SectionTitle className="mb-4">{t("bikeTitle")}</SectionTitle>
      {data.length === 0 ? (
        <p className="text-sm text-muted">{t("empty")}</p>
      ) : (
        <>
          <p id={summaryId} className="sr-only">
            {t("bikeSummary", { from, to, peak: String(peak) })}
          </p>
          <div className="h-[320px] w-full" aria-describedby={summaryId}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} />
                <XAxis dataKey="day" stroke={chrome.tick} tick={{ fill: chrome.tick }} />
                <YAxis stroke={chrome.tick} tick={{ fill: chrome.tick }} />
                <Tooltip
                  contentStyle={{
                    background: chrome.paper,
                    border: `1px solid ${chrome.grid}`,
                    color: chrome.ink,
                  }}
                />
                <Legend wrapperStyle={{ color: chrome.ink }} />
                <Line type="monotone" dataKey="total" name={t("passages")} stroke={chrome.accent} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}
