import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/dashboard/page-intro";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  await requireAdmin();
  const t = await getTranslations("Admin");

  return (
    <div>
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
    </div>
  );
}
