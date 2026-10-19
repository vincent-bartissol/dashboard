import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { toExplorerDataset, type DatasetConfig, type ExplorerDataset } from "./client";
import { DATASETS, datasetKeyById } from "./datasets";

export async function localizeExplorerDataset(
  dataset: DatasetConfig,
  locale: AppLocale = "fr",
): Promise<ExplorerDataset> {
  const t = await getTranslations({ locale, namespace: "Datasets" });
  const key = datasetKeyById(dataset.id);
  const base = toExplorerDataset(dataset);
  if (!key) return base;
  const titleKey = `${key}.title` as Parameters<typeof t>[0];
  return {
    ...base,
    title: t(titleKey),
    columns: base.columns.map((column) => ({
      ...column,
      label: t(`${key}.columns.${column.key}` as Parameters<typeof t>[0]),
    })),
  };
}

export async function localizeDatasetTitle(dataset: DatasetConfig, locale: AppLocale = "fr") {
  const t = await getTranslations({ locale, namespace: "Datasets" });
  const key = datasetKeyById(dataset.id);
  return key ? t(`${key}.title` as Parameters<typeof t>[0]) : dataset.title;
}

export async function localizeDatasetTitleById(datasetId: string, locale: AppLocale = "fr") {
  const dataset = Object.values(DATASETS).find((item) => item.id === datasetId);
  if (!dataset) return datasetId;
  return localizeDatasetTitle(dataset, locale);
}
