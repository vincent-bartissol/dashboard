"use client";

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

export function BikeCountChart({ records }: { records: OpenDataRecord[] }) {
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

  return (
    <Card>
      <h2 className="mb-4 font-display text-lg font-semibold text-navy">
        Passages vélos · rue Étienne Marcel (7 derniers jours)
      </h2>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4dcd0" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="total" name="Passages" stroke="#c8102e" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
