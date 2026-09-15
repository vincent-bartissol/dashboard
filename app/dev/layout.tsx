import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { fontClassName } from "@/lib/fonts";
import fr from "@/messages/fr.json";

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={fontClassName}>
      <body className="flex min-h-full flex-col bg-ground font-sans text-ink">
        <NextIntlClientProvider locale="fr" messages={fr}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
