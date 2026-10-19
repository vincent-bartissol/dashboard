import { bindLocale } from "@/lib/demo/locale-page";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Card } from "@/components/ui/card";

export default async function AdminMessagesPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Admin" });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/admin" className="text-sm font-medium text-heading hover:underline">
          {t("messages.back")}
        </Link>
        <PageIntro title={t("messages.title")}>{t("messages.body")}</PageIntro>
      </div>
      <Card>
        <p className="text-sm text-muted">{t("messages.empty")}</p>
      </Card>
    </div>
  );
}
