import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("Common");
  return (
    <p role="status" aria-live="polite" className="text-sm text-muted">
      {t("loading")}
    </p>
  );
}
