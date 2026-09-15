import { getTranslations } from "next-intl/server";
import { toExplorerDataset, type DatasetConfig, type ExplorerDataset } from "./client";
import { DATASETS, type DatasetKey } from "./datasets";

const KEY_BY_ID = Object.fromEntries(
  (Object.entries(DATASETS) as [DatasetKey, DatasetConfig][]).map(([key, dataset]) => [
    dataset.id,
    key,
  ]),
) as Record<string, DatasetKey>;

export async function localizeExplorerDataset(
  dataset: DatasetConfig,
): Promise<ExplorerDataset> {
  const t = await getTranslations("Datasets");
  const key = KEY_BY_ID[dataset.id];
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

export async function localizeDatasetTitle(dataset: DatasetConfig) {
  const t = await getTranslations("Datasets");
  const key = KEY_BY_ID[dataset.id];
  return key ? t(`${key}.title` as Parameters<typeof t>[0]) : dataset.title;
}
