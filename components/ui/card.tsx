import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-none border border-line bg-paper p-4 ${className}`}
    >
      {children}
    </section>
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
    <Card className="border-l-4 border-l-accent">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-navy">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </Card>
  );
}
