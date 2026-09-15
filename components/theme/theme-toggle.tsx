"use client";

import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyThemeClass,
  readThemeCookie,
  writeThemeCookie,
  type ColorScheme,
} from "@/lib/theme";

const OPTIONS: { value: ColorScheme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];

export function ThemeToggle({ invert = false }: { invert?: boolean }) {
  const [theme, setTheme] = useState<ColorScheme | null>(() => readThemeCookie());

  function onSelect(next: ColorScheme) {
    setTheme(next);
    writeThemeCookie(next);
    applyThemeClass(next);
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
      aria-label="Apparence"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`inline-flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium transition ${
              selected ? active : idle
            }`}
            aria-pressed={selected}
            aria-label={option.label}
            title={option.label}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
