import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-panel p-4 ${className}`}>{children}</section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="rule-accent">
      <p className="text-label">{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-heading">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </Card>
  );
}
