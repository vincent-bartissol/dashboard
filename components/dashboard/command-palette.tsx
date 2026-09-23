"use client";

import { useEffect, useId, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { SearchHit } from "@/lib/opendata/global-search";
import { datasetKeyById } from "@/lib/opendata/datasets";
import { Input } from "@/components/ui/input";

async function fetchSearch(q: string, signal?: AbortSignal): Promise<SearchHit[]> {
  const res = await fetch(`/api/opendata/search?q=${encodeURIComponent(q)}`, { signal });
  const data = (await res.json()) as { ok: boolean; results?: SearchHit[]; error?: string };
  if (!res.ok || !data.ok || !Array.isArray(data.results)) {
    throw new Error(res.status === 429 ? "rate_limited" : "opendata");
  }
  return data.results;
}

export function CommandPalette() {
  const t = useTranslations("CommandPalette");
  const tDatasets = useTranslations("Datasets");
  const tCommon = useTranslations("Common");
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  function datasetTitle(hit: SearchHit) {
    const key = datasetKeyById(hit.datasetId);
    if (!key) return hit.datasetTitle;
    return tDatasets(`${key}.title` as Parameters<typeof tDatasets>[0]);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setQuery(draft.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [draft, open]);

  const search = useQuery({
    queryKey: ["opendata-search", query],
    queryFn: ({ signal }) => fetchSearch(query, signal),
    enabled: open && query.length >= 2,
    placeholderData: keepPreviousData,
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 border border-white/20 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 focus-field"
        aria-label={t("open")}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{t("trigger")}</span>
        <kbd className="ml-auto hidden text-[10px] text-white/50 sm:inline">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-navy/50 p-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={inputId}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg border border-line bg-paper shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-line p-3">
          <Input
            id={inputId}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="px-2 py-3 text-sm text-muted">{t("hint")}</p>
          ) : search.isError ? (
            <p className="px-2 py-3 text-sm text-danger">
              {search.error instanceof Error && search.error.message === "rate_limited"
                ? tCommon("rateLimited")
                : tCommon("opendataDown")}
            </p>
          ) : search.isPending ? (
            <p className="px-2 py-3 text-sm text-muted">{t("loading")}</p>
          ) : (search.data?.length ?? 0) === 0 ? (
            <p className="px-2 py-3 text-sm text-muted">{t("empty")}</p>
          ) : (
            <ul className="space-y-0.5">
              {search.data?.map((hit) => (
                <li key={`${hit.datasetId}:${hit.recordId}`}>
                  <Link
                    href={hit.href}
                    onClick={() => setOpen(false)}
                    className="block px-2 py-2 text-sm hover:bg-ground focus-field"
                  >
                    <span className="font-medium text-heading">{hit.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{datasetTitle(hit)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-line px-3 py-2 text-xs text-muted">{t("footer")}</div>
      </div>
    </div>
  );
}
