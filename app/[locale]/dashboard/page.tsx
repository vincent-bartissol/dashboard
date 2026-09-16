import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageIntro } from "@/components/dashboard/page-intro";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { getProfile, listFavorites } from "@/lib/db/queries";
import { fetchAggregate, fetchCount, formatCount } from "@/lib/opendata/client";
import { ARRONDISSEMENTS } from "@/lib/opendata/arrondissement";
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

function districtLabel(
  code: string | null,
  t: Awaited<ReturnType<typeof getTranslations<"Common">>>,
) {
  if (!code) return t("allParis");
  if (code === "montreuil") return t("montreuil");
  const found = ARRONDISSEMENTS.find((item) => item.code === code);
  return found ? t("arrondissement", { label: found.label }) : t("allParis");
}

export default async function DashboardPage() {
  const session = await requireSession();
  const t = await getTranslations("Overview");
  const common = await getTranslations("Common");
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
          district: districtLabel(profile.arrondissement, common),
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
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {THEME_IDS.map((id) => (
          <Link key={id} href={THEME_HREF[id]}>
            <Card className="h-full transition hover:border-navy/30">
              <SectionTitle>{t(`themes.${id}.title`)}</SectionTitle>
              <p className="mt-1 text-sm text-muted">{t(`themes.${id}.body`)}</p>
            </Card>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-muted">
        {t.rich("catalog", {
          fountains: formatCount(fountains, (value) => format.number(value)),
          markets: formatCount(markets, (value) => format.number(value)),
          profile: (chunks) => (
            <Link href="/dashboard/profile" className="text-navy hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  );
}
