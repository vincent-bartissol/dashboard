"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { MailContent } from "@/lib/email/templates";

export function DemoEmailPreview({
  mail,
  onOpen,
}: Readonly<{
  mail: MailContent;
  onOpen: () => void;
}>) {
  const t = useTranslations("Demo");
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("emailIntro")}</p>
      <div className="rounded border border-line bg-paper p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{t("emailSubject")}</p>
        <p className="mt-1 text-sm font-semibold text-heading">{mail.subject}</p>
        <div
          className="mt-4 max-h-80 overflow-auto rounded border border-line bg-white p-3 text-sm"
          dangerouslySetInnerHTML={{ __html: mail.html }}
        />
      </div>
      <Button type="button" className="w-full" onClick={onOpen}>
        {t("openEmailLink")}
      </Button>
    </div>
  );
}
