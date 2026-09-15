"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/heading";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("Error");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <PageTitle>{t("title")}</PageTitle>
      <p className="text-sm text-muted">{t("body")}</p>
      <Button type="button" onClick={() => retry()}>
        {t("retry")}
      </Button>
    </div>
  );
}
