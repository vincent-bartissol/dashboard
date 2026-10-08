"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
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

function subscribeNoop() {
  return () => {};
}

function applePlatformSnapshot() {
  return (
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || navigator.userAgent.includes("Mac")
  );
}

function useIsApplePlatform() {
  return useSyncExternalStore(subscribeNoop, applePlatformSnapshot, () => false);
}

function focusableWithin(root: HTMLElement) {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
}

function searchStatusMessage(params: {
  queryLength: number;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  resultCount: number;
  hint: string;
  loading: string;
  empty: string;
  results: (count: string) => string;
  rateLimited: string;
  opendataDown: string;
}): string {
  if (params.queryLength < 2) return params.hint;
  if (params.isPending) return params.loading;
  if (params.isError) {
    if (params.error instanceof Error && params.error.message === "rate_limited") {
      return params.rateLimited;
    }
    return params.opendataDown;
  }
  if (params.resultCount === 0) return params.empty;
  return params.results(String(params.resultCount));
}

function renderSearchResults(params: {
  queryLength: number;
  isError: boolean;
  isPending: boolean;
  error: unknown;
  resultCount: number;
  hint: string;
  loading: string;
  empty: string;
  rateLimited: string;
  opendataDown: string;
  hits: ReactNode;
}): ReactNode {
  if (params.queryLength < 2) {
    return <p className="px-2 py-3 text-sm text-muted">{params.hint}</p>;
  }
  if (params.isError) {
    let message = params.opendataDown;
    if (params.error instanceof Error && params.error.message === "rate_limited") {
      message = params.rateLimited;
    }
    return <p className="px-2 py-3 text-sm text-danger">{message}</p>;
  }
  if (params.isPending) {
    return <p className="px-2 py-3 text-sm text-muted">{params.loading}</p>;
  }
  if (params.resultCount === 0) {
    return <p className="px-2 py-3 text-sm text-muted">{params.empty}</p>;
  }
  return params.hits;
}

export function CommandPalette() {
  const t = useTranslations("CommandPalette");
  const tDatasets = useTranslations("Datasets");
  const tCommon = useTranslations("Common");
  const inputId = useId();
  const statusId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const apple = useIsApplePlatform();
  const shortcutLabel = apple ? "⌘K" : "Ctrl+K";

  function datasetTitle(hit: SearchHit) {
    const key = datasetKeyById(hit.datasetId);
    if (!key) return hit.datasetTitle;
    return tDatasets(`${key}.title` as Parameters<typeof tDatasets>[0]);
  }

  function close() {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setQuery(draft.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [draft, open]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const input = panel.querySelector<HTMLElement>("input");
    input?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = focusableWithin(panelRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes.at(-1);
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey) {
        if (active === first || !panelRef.current.contains(active)) {
          event.preventDefault();
          last?.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const search = useQuery({
    queryKey: ["opendata-search", query],
    queryFn: ({ signal }) => fetchSearch(query, signal),
    enabled: open && query.length >= 2,
    placeholderData: keepPreviousData,
  });

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 border border-white/20 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 focus-field"
        aria-label={t("open")}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{t("trigger")}</span>
        <kbd className="ml-auto hidden text-[10px] text-white/50 sm:inline">{shortcutLabel}</kbd>
      </button>
    );
  }

  const statusMessage = searchStatusMessage({
    queryLength: query.length,
    isPending: search.isPending,
    isError: search.isError,
    error: search.error,
    resultCount: search.data?.length ?? 0,
    hint: t("hint"),
    loading: t("loading"),
    empty: t("empty"),
    results: (count) => t("results", { count }),
    rateLimited: tCommon("rateLimited"),
    opendataDown: tCommon("opendataDown"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-navy/50"
        aria-label={t("close")}
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={inputId}
        className="relative z-10 w-full max-w-lg border border-line bg-paper shadow-lg"
      >
        <div className="border-b border-line p-3">
          <Input
            id={inputId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            aria-describedby={statusId}
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          <p id={statusId} className="sr-only" aria-live="polite">
            {statusMessage}
          </p>
          {renderSearchResults({
            queryLength: query.length,
            isError: search.isError,
            isPending: search.isPending,
            error: search.error,
            resultCount: search.data?.length ?? 0,
            hint: t("hint"),
            loading: t("loading"),
            empty: t("empty"),
            rateLimited: tCommon("rateLimited"),
            opendataDown: tCommon("opendataDown"),
            hits: (
              <ul className="space-y-0.5">
                {search.data?.map((hit) => (
                  <li key={`${hit.datasetId}:${hit.recordId}`}>
                    <Link
                      href={hit.href}
                      onClick={close}
                      className="block px-2 py-2 text-sm hover:bg-ground focus-field"
                    >
                      <span className="font-medium text-heading">{hit.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{datasetTitle(hit)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ),
          })}
        </div>
        <div className="border-t border-line px-3 py-2 text-xs text-muted">{t("footer")}</div>
      </div>
    </div>
  );
}
