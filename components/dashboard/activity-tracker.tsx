"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/navigation";
import { trackPageView } from "@/lib/actions/activity";

export function DashboardActivityTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastSent.current) return;
    lastSent.current = pathname;
    // Best-effort beacon. A non-RSC response (dev rebuild, 500) rejects
    // fetchServerAction; leaving it unhandled is what Sentry reports.
    void trackPageView(pathname).catch(() => {});
  }, [pathname]);

  return null;
}
