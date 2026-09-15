"use client";

import { useEffect } from "react";
import { applyThemeClass, readThemeCookie } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    function apply() {
      applyThemeClass(readThemeCookie());
    }
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return null;
}
