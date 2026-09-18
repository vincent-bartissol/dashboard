import { getLocale, getTranslations } from "next-intl/server";
import { AdminUserTable } from "@/components/admin/user-table";
import { PageIntro } from "@/components/dashboard/page-intro";
import { listUsersForAdmin } from "@/lib/db/queries";
import { requireAdmin } from "@/lib/session";

export default async function AdminPage() {
  await requireAdmin();
  const t = await getTranslations("Admin");
  const locale = await getLocale();
  const users = await listUsersForAdmin();

  return (
    <div className="space-y-6">
      <PageIntro title={t("title")}>{t("body")}</PageIntro>
      <AdminUserTable users={users} locale={locale} />
    </div>
  );
}
