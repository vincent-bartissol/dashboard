import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { DatasetConfig } from "@/lib/opendata/client";
import { localizeDatasetTitle } from "@/lib/opendata/localize";
import { PageTitle } from "@/components/ui/heading";

export async function PageIntro({
  title,
  children,
  dataset,
}: {
  title: string;
  children: ReactNode;
  dataset?: DatasetConfig | DatasetConfig[];
}) {
  const t = await getTranslations("Common");
  const datasets = dataset ? (Array.isArray(dataset) ? dataset : [dataset]) : [];
  const sources = await Promise.all(
    datasets.map(async (item) => ({
      id: item.id,
      sourceUrl: item.sourceUrl,
      title: await localizeDatasetTitle(item),
    })),
  );
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="rule-accent pl-4">
        <PageTitle size="lg">{title}</PageTitle>
        <p className="mt-1 max-w-2xl text-muted">{children}</p>
      </div>
      {sources.length ? (
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          {sources.map((item) => (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-heading hover:underline"
            >
              {t("source", { title: item.title })}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
