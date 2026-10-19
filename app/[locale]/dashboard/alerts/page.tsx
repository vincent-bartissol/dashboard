import { bindLocale } from "@/lib/demo/locale-page";
import { getTranslations } from "next-intl/server";
import { AlertsClient } from "@/components/dashboard/alerts-client";
import { PageIntro } from "@/components/dashboard/page-intro";

export default async function AlertsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Pages.alerts" });

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")} locale={locale}>{t("body")}</PageIntro>
      <AlertsClient initial={[]} />
    </div>
  );
}
