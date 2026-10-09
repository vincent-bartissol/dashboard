import type { ReactNode } from "react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { PageIntro } from "@/components/dashboard/page-intro";
import { ThemeCardGrid } from "@/components/dashboard/theme-cards";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { getProfile, listFavorites } from "@/lib/db/queries";
import { fetchAggregate, fetchCount, formatCount } from "@/lib/opendata/client";
import {
  ARRONDISSEMENTS,
  formatDistrictOrdinal,
} from "@/lib/opendata/arrondissement";
import { DATASETS } from "@/lib/opendata/datasets";
import { requireSession } from "@/lib/session";

const THEME_IDS = [
  "montreuil",
  "velib",
  "nature",
  "air",
  "amenities",
  "events",
  "traffic",
  "markets",
] as const;

const THEME_HREF: Record<(typeof THEME_IDS)[number], string> = {
  montreuil: "/dashboard/montreuil",
  velib: "/dashboard/velib",
  nature: "/dashboard/nature",
  air: "/dashboard/air",
  amenities: "/dashboard/amenities",
  events: "/dashboard/events",
  traffic: "/dashboard/traffic",
  markets: "/dashboard/markets",
};

function ProfileCatalogLink({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Link href="/dashboard/profile" className="text-heading underline">
      {children}
    </Link>
  );
}

function catalogProfileChunk(chunks: ReactNode) {
  return <ProfileCatalogLink>{chunks}</ProfileCatalogLink>;
}

function districtLabel(
  code: string | null,
  t: Awaited<ReturnType<typeof getTranslations<"Common">>>,
  locale: AppLocale,
) {
  if (!code) return t("allParis");
  if (code === "montreuil") return t("montreuil");
  const found = ARRONDISSEMENTS.find((item) => item.code === code);
  return found
    ? t("arrondissement", { label: formatDistrictOrdinal(found.code, locale) })
    : t("allParis");
}

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getTranslations("Overview");
  const common = await getTranslations("Common");
  const locale = (await getLocale()) as AppLocale;
  const format = await getFormatter();
  const [profile, favorites, velib, trees, events, fountains, markets] = await Promise.all([
    getProfile(session.user.id),
    listFavorites(session.user.id),
    fetchAggregate<{ bikes?: number; ebikes?: number }>(
      DATASETS.velib.id,
      "sum(numbikesavailable) as bikes, sum(ebike) as ebikes",
      DATASETS.velib.revalidate,
    ),
    fetchCount(DATASETS.trees.id, DATASETS.trees.revalidate),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate),
    fetchCount(DATASETS.fountains.id, DATASETS.fountains.revalidate),
    fetchCount(DATASETS.markets.id, DATASETS.markets.revalidate),
  ]);

  const bikes = Number(velib.page.results[0]?.bikes ?? 0);
  const ebikes = Number(velib.page.results[0]?.ebikes ?? 0);
  const countError = [velib, trees, events, fountains, markets].find((result) => !result.ok)?.error;

  return (
    <div>
      <PageIntro title={t("title")}>
        {t("hello", {
          name: profile.firstName || session.user.name,
          district: districtLabel(profile.arrondissement, common, locale),
        })}
      </PageIntro>
      <DatasetNotice error={countError} />
      <KpiStrip
        items={[
          {
            label: t("bikes"),
            value: velib.ok ? format.number(bikes) : "—",
            hint: velib.ok ? t("ebikes", { count: format.number(ebikes) }) : undefined,
          },
          { label: t("trees"), value: formatCount(trees, (value) => format.number(value)) },
          { label: t("events"), value: formatCount(events, (value) => format.number(value)) },
          { label: t("favorites"), value: favorites.length },
        ]}
      />
      <ThemeCardGrid
        items={THEME_IDS.map((id) => ({
          id,
          href: THEME_HREF[id],
          title: t(`themes.${id}.title`),
          body: t(`themes.${id}.body`),
        }))}
      />
      <p className="mt-6 text-sm text-muted">
        {t.rich("catalog", {
          fountains: formatCount(fountains, (value) => format.number(value)),
          markets: formatCount(markets, (value) => format.number(value)),
          profile: catalogProfileChunk,
        })}
      </p>
    </div>
  );
}
