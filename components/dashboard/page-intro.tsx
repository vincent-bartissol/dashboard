import type { ReactNode } from "react";
import type { DatasetConfig } from "@/lib/opendata/client";

export function PageIntro({
  title,
  children,
  dataset,
}: {
  title: string;
  children: ReactNode;
  dataset?: DatasetConfig | DatasetConfig[];
}) {
  const datasets = dataset ? (Array.isArray(dataset) ? dataset : [dataset]) : [];
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="border-l-4 border-accent pl-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-navy">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-muted">{children}</p>
      </div>
      {datasets.length ? (
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          {datasets.map((item) => (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-navy hover:underline"
            >
              Source : {item.title}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
