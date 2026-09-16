"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyThemeClass,
  readThemeCookie,
  writeThemeCookie,
  type ColorScheme,
} from "@/lib/theme";

const THEME_EVENT = "paris-ouverte-theme";

const OPTIONS: { value: ColorScheme; icon: typeof Sun }[] = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
];

function subscribe(onStoreChange: () => void) {
  window.addEventListener(THEME_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_EVENT, onStoreChange);
}

function getSnapshot() {
  return readThemeCookie();
}

export function ThemeToggle({
  invert = false,
  initial = "system",
}: {
  invert?: boolean;
  initial?: ColorScheme;
}) {
  const t = useTranslations("Common");
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => initial);

  function onSelect(next: ColorScheme) {
    writeThemeCookie(next);
    applyThemeClass(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const frame = invert
    ? "border-white/20 bg-white/5"
    : "border-line bg-paper";
  const idle = invert
    ? "text-white/70 hover:bg-white/10 hover:text-white"
    : "text-muted hover:bg-ground hover:text-heading";
  const active = invert ? "bg-white text-navy" : "bg-heading text-paper";

  return (
    <div
      className={`inline-flex rounded-none border ${frame}`}
      role="group"
      aria-label={t("appearance")}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = theme === option.value;
        const label = t(`theme.${option.value}`);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium transition ${
              selected ? active : idle
            }`}
            aria-pressed={selected}
            aria-label={label}
            title={label}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
