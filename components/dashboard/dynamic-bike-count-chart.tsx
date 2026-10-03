"use client";

import dynamic from "next/dynamic";

export const DynamicBikeCountChart = dynamic(
  () => import("./bike-count-chart").then((mod) => mod.BikeCountChart),
  { ssr: false },
);
