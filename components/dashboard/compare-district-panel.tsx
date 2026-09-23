"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFormatter, useTranslations } from "next-intl";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
import { fetchThemePage, themeQueryKey } from "@/lib/opendata/theme-query";
import { DATASETS } from "@/lib/opendata/datasets";
import { Card } from "@/components/ui/card";

function datasetHasGeo(datasetId: string) {
  return Object.values(DATASETS).some(
    (dataset) => dataset.id === datasetId && Boolean(dataset.geoField),
  );
}

export function CompareDistrictPanel({
  datasetId,
  primaryCount,
}: {
  datasetId: string;
  primaryCount: number;
}) {
  const t = useTranslations("Compare");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const [district, setDistrict] = useState("");
  const [open, setOpen] = useState(false);
  const useMarkers = datasetHasGeo(datasetId);

  const query = useQuery({
    queryKey: themeQueryKey(datasetId, district || null),
    queryFn: ({ signal }) =>
      fetchThemePage(datasetId, {
        district,
        signal,
        mode: useMarkers ? "markers" : undefined,
      }),
    enabled: open && district.length > 0,
  });

  const compareCount = query.data?.total_count;
  const isVelib = datasetId === DATASETS.velib.id;
  const compareBikes = isVelib
    ? query.data?.results.reduce((sum, row) => sum + Number(row.numbikesavailable ?? 0), 0)
    : undefined;

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-heading">{t("title")}</p>
        <button
          type="button"
          className="text-sm text-heading underline focus-field"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? t("hide") : t("show")}
        </button>
      </div>
      {open ? (
        <>
          <label className="block text-sm text-muted">
            {t("district")}
            <select
              className="mt-1 block w-full max-w-xs border border-line bg-paper px-2 py-1.5 text-sm text-ink focus-field"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            >
              <option value="">{t("pick")}</option>
              {ARRONDISSEMENTS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
              <option value="montreuil">{tCommon("montreuil")}</option>
            </select>
          </label>
          {query.isError ? (
            <p className="text-sm text-danger">{tCommon("opendataDown")}</p>
          ) : null}
          {district && query.data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{t("current")}</p>
                <p className="text-lg font-medium text-heading">{format.number(primaryCount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">{t("compare")}</p>
                <p className="text-lg font-medium text-heading">
                  {format.number(compareCount ?? 0)}
                </p>
                {compareBikes != null ? (
                  <p className="text-sm text-muted">
                    {t("bikes")}: {format.number(compareBikes)}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
