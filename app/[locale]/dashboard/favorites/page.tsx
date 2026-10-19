import { getTranslations } from "next-intl/server";
import { FavoritesPageClient } from "@/components/dashboard/favorites-page-client";
import { PageIntro } from "@/components/dashboard/page-intro";
import { bindLocale } from "@/lib/demo/locale-page";

export default async function FavoritesPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const locale = await bindLocale(params);
  const t = await getTranslations({ locale, namespace: "Pages.favorites" });

  return (
    <div>
      <PageIntro title={t("title")} locale={locale}>
        {t("body")}
      </PageIntro>
      <FavoritesPageClient />
    </div>
  );
}
