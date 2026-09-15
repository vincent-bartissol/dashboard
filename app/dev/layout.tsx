import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeSync } from "@/components/theme/theme-sync";
import { fontClassName } from "@/lib/fonts";
import fr from "@/messages/fr.json";
import { THEME_SCRIPT } from "@/lib/theme";

export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={fontClassName}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-ground font-sans text-ink">
        <ThemeSync />
        <NextIntlClientProvider locale="fr" messages={fr}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
