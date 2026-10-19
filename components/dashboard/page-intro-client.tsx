"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageIntroView } from "@/components/dashboard/page-intro-view";

export function PageIntroClient({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  const t = useTranslations("Common");
  return (
    <PageIntroView title={title} opensInNewTab={t("opensInNewTab")}>
      {children}
    </PageIntroView>
  );
}
