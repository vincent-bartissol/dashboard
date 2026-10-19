import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import type { DatasetConfig } from "@/lib/opendata/client";
import { localizeDatasetTitle } from "@/lib/opendata/localize";
import { PageIntroView } from "@/components/dashboard/page-intro-view";

function datasetsFromProp(dataset?: DatasetConfig | DatasetConfig[]) {
  if (!dataset) return [];
  if (Array.isArray(dataset)) return dataset;
  return [dataset];
}

export async function PageIntro({
  title,
  children,
  dataset,
  locale = "fr",
}: Readonly<{
  title: string;
  children: ReactNode;
  dataset?: DatasetConfig | DatasetConfig[];
  locale?: AppLocale;
}>) {
  const t = await getTranslations({ locale, namespace: "Common" });
  const datasets = datasetsFromProp(dataset);
  const sources = await Promise.all(
    datasets.map(async (item) => ({
      id: item.id,
      sourceUrl: item.sourceUrl,
      title: await localizeDatasetTitle(item, locale),
    })),
  );
  return (
    <PageIntroView
      title={title}
      sources={sources}
      sourceLabel={(itemTitle) => t("source", { title: itemTitle })}
      opensInNewTab={t("opensInNewTab")}
    >
      {children}
    </PageIntroView>
  );
}
