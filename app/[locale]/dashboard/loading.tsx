import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Common");
  return <p className="text-sm text-muted">{t("loading")}</p>;
}
