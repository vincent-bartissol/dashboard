"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function MapLoading() {
  const t = useTranslations("Common");
  return (
    <div className="surface-panel flex h-[420px] items-center justify-center text-sm text-muted">
      {t("mapLoading")}
    </div>
  );
}

export const DynamicParisMap = dynamic(
  () => import("./paris-map").then((mod) => mod.ParisMap),
  {
    ssr: false,
    loading: MapLoading,
  },
);
