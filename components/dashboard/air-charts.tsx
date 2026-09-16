"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OpenDataRecord } from "@/lib/opendata/client";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { useChartChrome } from "@/components/theme/use-chart-chrome";

const SERIES = [
  { key: "ind_jour_qa_bonne", color: "#2f9e44" },
  { key: "ind_jour_qa_moyenne", color: "#fab005" },
  { key: "ind_jour_qa_degradee", color: "#fd7e14" },
  { key: "ind_jour_qa_mauvaise", color: "#c8102e" },
  { key: "ind_jour_qa_tres_mauvaise", color: "#7b1e3a" },
  { key: "ind_jour_qa_extremement_mauvaise", color: "#12263a" },
] as const;

export function AirCharts({ records }: { records: OpenDataRecord[] }) {
  const chrome = useChartChrome();
  const t = useTranslations("Datasets.air.columns");
  const title = useTranslations("Pages.air");
  const charts = useTranslations("Charts");
  const summaryId = useId();
  const data = [...records]
    .sort((a, b) => String(a.annee).localeCompare(String(b.annee)))
    .map((row) => ({
      annee: String(row.annee),
      ...Object.fromEntries(SERIES.map((item) => [item.key, Number(row[item.key] ?? 0)])),
    }));
  const from = data[0]?.annee ?? "—";
  const to = data[data.length - 1]?.annee ?? "—";

  return (
    <Card>
      <SectionTitle className="mb-4">{title("chartTitle")}</SectionTitle>
      {data.length === 0 ? (
        <p className="text-sm text-muted">{charts("empty")}</p>
      ) : (
        <>
          <p id={summaryId} className="sr-only">
            {charts("airSummary", { from, to })}
          </p>
          <div className="h-[360px] w-full" aria-describedby={summaryId}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} />
                <XAxis dataKey="annee" stroke={chrome.tick} tick={{ fill: chrome.tick }} />
                <YAxis stroke={chrome.tick} tick={{ fill: chrome.tick }} />
                <Tooltip
                  contentStyle={{
                    background: chrome.paper,
                    border: `1px solid ${chrome.grid}`,
                    color: chrome.ink,
                  }}
                />
                <Legend wrapperStyle={{ color: chrome.ink }} />
                {SERIES.map((item) => (
                  <Bar key={item.key} dataKey={item.key} name={t(item.key)} fill={item.color} stackId="atmo" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  );
}
