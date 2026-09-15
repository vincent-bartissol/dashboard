"use client";

import { useHtmlDark } from "@/components/theme/use-html-dark";

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function useChartChrome() {
  const dark = useHtmlDark();
  return {
    dark,
    grid: cssVar("--line", dark ? "#2c3a48" : "#d8dce3"),
    tick: cssVar("--muted", dark ? "#9aa3ad" : "#5a616c"),
    ink: cssVar("--ink", dark ? "#e8e4d9" : "#12141a"),
    paper: cssVar("--paper", dark ? "#1a2430" : "#ffffff"),
    accent: cssVar("--accent", "#c8102e"),
  };
}
