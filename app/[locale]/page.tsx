import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { Card, KpiCard } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";
import { DatasetNotice } from "@/components/dashboard/dataset-notice";
import { fetchAggregate, fetchCount, fetchRecordsSafe, formatCount } from "@/lib/opendata/client";
import { DATASETS } from "@/lib/opendata/datasets";

export default async function Home() {
  const t = await getTranslations("Landing");
  const format = await getFormatter();
  const [velibCount, treeCount, eventCount, velibAgg, atmo] = await Promise.all([
    fetchCount(DATASETS.velib.id, DATASETS.velib.revalidate),
    fetchCount(DATASETS.trees.id, DATASETS.trees.revalidate),
    fetchCount(DATASETS.events.id, DATASETS.events.revalidate),
    fetchAggregate<{ bikes?: number }>(
      DATASETS.velib.id,
      "sum(numbikesavailable) as bikes",
      DATASETS.velib.revalidate,
    ),
    fetchRecordsSafe<{
      annee?: string;
      ind_jour_qa_bonne?: number;
      ind_jour_qa_moyenne?: number;
    }>(DATASETS.air.id, { limit: 5, orderBy: "annee desc" }, DATASETS.air.revalidate),
  ]);

  const bikes = Number(velibAgg.page.results[0]?.bikes ?? 0);
  const latestAir = atmo.page.results[0];
  const openDataError = [velibCount, treeCount, eventCount, velibAgg, atmo].some(
    (result) => !result.ok,
  );
  const bikesLabel = velibAgg.ok ? format.number(bikes) : "—";
  const stationsLabel = formatCount(velibCount, (value) => format.number(value));
  const treesLabel = formatCount(treeCount, (value) => format.number(value));
  const eventsLabel = formatCount(eventCount, (value) => format.number(value));
  const pillars = [
    { title: t("pillar1Title"), body: t("pillar1Body") },
    { title: t("pillar2Title"), body: t("pillar2Body") },
    { title: t("pillar3Title"), body: t("pillar3Body") },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-line bg-navy text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
            <div>
              <Wordmark href="/" invert size="lg" />
              <h1 className="mt-8 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/75">{t("heroBody")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/signup">{t("signup")}</Button>
                <Button
                  href="/login"
                  variant="ghost"
                  className="border-white/25 bg-transparent text-white hover:border-white/50"
                >
                  {t("login")}
                </Button>
              </div>
            </div>
            <Card className="border-white/15 bg-paper text-ink">
              <p className="text-sm font-medium text-heading">{t("live")}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">{t("stations")}</dt>
                  <dd className="font-semibold tabular-nums">{stationsLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">{t("bikesAvailable")}</dt>
                  <dd className="font-semibold tabular-nums">{bikesLabel}</dd>
                </div>
                <div className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">{t("treesCounted")}</dt>
                  <dd className="font-semibold tabular-nums">{treesLabel}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">{t("events")}</dt>
                  <dd className="font-semibold tabular-nums">{eventsLabel}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <SectionTitle size="lg">{t("kpisTitle")}</SectionTitle>
          <p className="mt-2 max-w-2xl text-muted">{t("kpisBody")}</p>
          {openDataError ? (
            <div className="mt-4">
              <DatasetNotice error="opendata" />
            </div>
          ) : null}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Vélib’" value={bikesLabel} hint={t("kpiVelibHint")} />
            <KpiCard label="Nature" value={treesLabel} hint={t("kpiNatureHint")} />
            <KpiCard
              label="Air"
              value={
                latestAir ? t("kpiAirValue", { count: String(latestAir.ind_jour_qa_bonne ?? "—") }) : "—"
              }
              hint={
                latestAir
                  ? t("kpiAirHint", { year: String(latestAir.annee) })
                  : t("kpiAirUnavailable")
              }
            />
            <KpiCard label="Agenda" value={eventsLabel} hint={t("kpiAgendaHint")} />
          </div>
        </section>

        <section className="border-y border-line bg-paper">
          <div className="mx-auto grid max-w-6xl gap-0 px-6 py-12 lg:grid-cols-3">
            {pillars.map((item, index) => (
              <div
                key={item.title}
                className={`py-2 lg:px-6 lg:py-0 ${
                  index > 0 ? "border-t border-line pt-6 lg:border-t-0 lg:border-l lg:pt-0" : ""
                } ${index === 0 ? "lg:pl-0" : ""} ${index === 2 ? "lg:pr-0" : ""}`}
              >
                <SectionTitle as="h3">{item.title}</SectionTitle>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="rule-accent flex flex-col items-start justify-between gap-4 bg-navy px-8 py-10 text-white sm:flex-row sm:items-center">
            <div>
              <SectionTitle size="lg" invert>
                {t("ctaTitle")}
              </SectionTitle>
              <p className="mt-2 max-w-xl text-white/75">{t("ctaBody")}</p>
            </div>
            <Button href="/signup">{t("ctaSignup")}</Button>
          </div>
          <p className="mt-6 text-sm text-muted">
            {t("already")}{" "}
            <Link href="/login" className="font-medium text-heading hover:underline">
              {t("login")}
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
