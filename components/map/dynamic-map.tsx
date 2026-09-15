"use client";

import dynamic from "next/dynamic";

export const DynamicParisMap = dynamic(
  () => import("./paris-map").then((mod) => mod.ParisMap),
  {
    ssr: false,
    loading: () => (
      <div className="surface-panel flex h-[420px] items-center justify-center text-sm text-muted">
        Chargement de la carte…
      </div>
    ),
  },
);
