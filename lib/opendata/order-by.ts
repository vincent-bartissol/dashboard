import type { DatasetConfig } from "./client";

export function themeOrderBy(dataset: DatasetConfig): string | undefined {
  if (dataset.idField && dataset.idField !== dataset.geoField && !dataset.idField.includes(",")) {
    return dataset.idField;
  }
  if (dataset.id === "que-faire-a-paris-") {
    return "date_start";
  }
  if (dataset.titleField && dataset.titleField !== dataset.geoField) {
    return dataset.titleField;
  }
  return undefined;
}
