import { fetchRecordsBrowser } from "@/lib/opendata/browser-fetch";
import { recordId, recordLabel, type DatasetConfig } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";
import type { SearchHit } from "@/lib/opendata/global-search";

type Searchable = {
  config: DatasetConfig;
  href: string;
  searchField: string;
};

const SEARCHABLE: Searchable[] = [
  { config: DATASETS.velib, href: "/dashboard/velib", searchField: "name" },
  { config: DATASETS.events, href: "/dashboard/events", searchField: "title" },
  { config: DATASETS.markets, href: "/dashboard/markets", searchField: "nom_long" },
  { config: DATASETS.fountains, href: "/dashboard/amenities", searchField: "voie" },
];

function escapeSearch(value: string) {
  return value.replaceAll("\\", String.raw`\\`).replaceAll('"', String.raw`\"`);
}

export async function searchOpenDataBrowser(
  query: string,
  signal?: AbortSignal,
): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const needle = escapeSearch(q);
  const pages = await Promise.all(
    SEARCHABLE.map(async ({ config, href, searchField }) => {
      const where = `search(${searchField}, "${needle}")`;
      const result = await fetchRecordsBrowser(config.id, {
        limit: 5,
        where,
        host: config.host,
        orderBy: searchField,
        signal,
      });
      if (!result.ok) return [] as SearchHit[];
      return result.page.results.map((record, index) => {
        const id = recordId(record, config.idField) || `${config.id}-${index}`;
        return {
          datasetId: config.id,
          datasetTitle: config.title,
          recordId: id,
          label: recordLabel(record, config.titleField, id),
          href,
        };
      });
    }),
  );
  return pages.flat().slice(0, 20);
}
