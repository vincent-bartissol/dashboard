"use client";

import dynamic from "next/dynamic";

export const DynamicAirCharts = dynamic(
  () => import("./air-charts").then((mod) => mod.AirCharts),
  { ssr: false },
);
