"use client";

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

const SERIES = [
  { key: "ind_jour_qa_bonne", color: "#2f9e44" },
  { key: "ind_jour_qa_moyenne", color: "#fab005" },
  { key: "ind_jour_qa_degradee", color: "#fd7e14" },
  { key: "ind_jour_qa_mauvaise", color: "#c8102e" },
  { key: "ind_jour_qa_tres_mauvaise", color: "#7b1e3a" },
  { key: "ind_jour_qa_extremement_mauvaise", color: "#12263a" },
] as const;

export function AirCharts({ records }: { records: OpenDataRecord[] }) {
  const t = useTranslations("Datasets.air.columns");
  const title = useTranslations("Pages.air");
  const data = [...records]
    .sort((a, b) => String(a.annee).localeCompare(String(b.annee)))
    .map((row) => ({
      annee: String(row.annee),
      ...Object.fromEntries(SERIES.map((item) => [item.key, Number(row[item.key] ?? 0)])),
    }));

  return (
    <Card>
      <SectionTitle className="mb-4">{title("chartTitle")}</SectionTitle>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4dcd0" />
            <XAxis dataKey="annee" />
            <YAxis />
            <Tooltip />
            <Legend />
            {SERIES.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={t(item.key)} fill={item.color} stackId="atmo" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
