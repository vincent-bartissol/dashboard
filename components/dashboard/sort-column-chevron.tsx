"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type { SortDir } from "@/lib/opendata/sort";

export function SortColumnChevron({
  active,
  sortDir,
}: Readonly<{ active: boolean; sortDir: SortDir }>) {
  if (!active) return null;
  if (sortDir === "asc") {
    return <ChevronUp className="h-3.5 w-3.5" aria-hidden />;
  }
  return <ChevronDown className="h-3.5 w-3.5" aria-hidden />;
}
