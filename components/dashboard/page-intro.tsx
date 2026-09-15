import type { ReactNode } from "react";
import type { DatasetConfig } from "@/lib/opendata/client";
import { PageTitle } from "@/components/ui/heading";

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
      <div className="rule-accent pl-4">
        <PageTitle size="lg">{title}</PageTitle>
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
              className="hover:text-heading hover:underline"
            >
              Source : {item.title}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
