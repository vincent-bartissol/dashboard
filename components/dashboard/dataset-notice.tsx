import { getTranslations } from "next-intl/server";

export async function DatasetNotice({
  error,
}: Readonly<{ error?: string }>) {
  const t = await getTranslations("Common");
  if (!error) return null;
  return (
    <p role="status" aria-live="polite" className="text-sm text-danger">
      {t("opendataDown")}
    </p>
  );
}
