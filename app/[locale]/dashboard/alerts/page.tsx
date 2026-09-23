import { getTranslations } from "next-intl/server";
import { AlertsClient } from "@/components/dashboard/alerts-client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { listAlertRules } from "@/lib/alerts/store";
import { requireSession } from "@/lib/session";

export default async function AlertsPage() {
  const session = await requireSession();
  const t = await getTranslations("Pages.alerts");
  const rules = await listAlertRules(session.user.id);

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
      <AlertsClient initial={rules} />
    </div>
  );
}
