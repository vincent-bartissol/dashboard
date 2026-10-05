import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-panel panel-lift p-4 ${className}`}>{children}</div>
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
    <Card>
      <span className="mb-3 block h-1 w-10 bg-accent" aria-hidden />
      <p className="text-label">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-tight tabular-nums text-heading">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </Card>
  );
}
