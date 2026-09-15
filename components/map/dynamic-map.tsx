"use client";

import dynamic from "next/dynamic";

export const DynamicParisMap = dynamic(
  () => import("./paris-map").then((mod) => mod.ParisMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-none border border-line bg-paper text-sm text-muted">
        Chargement de la carte…
      </div>
    ),
  },
);
