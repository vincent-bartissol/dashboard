import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { Wordmark } from "@/components/layout/wordmark";
import { Card } from "@/components/ui/card";

export async function AuthFrame({
  children,
}: Readonly<{ children: ReactNode }>) {
  const t = await getTranslations("Landing");

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader variant="auth" />
      <main id="main" className="flex flex-1">
        <div className="hidden w-[min(42%,28rem)] flex-col justify-between bg-navy px-10 py-12 text-white lg:flex">
          <Wordmark href="/" invert />
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight">{t("heroTitle")}</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">{t("heroBody")}</p>
          </div>
          <p className="text-sm text-white/50">Paris Ouverte</p>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md">
            <span className="mb-4 block h-1 w-10 bg-accent" aria-hidden />
            {children}
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
