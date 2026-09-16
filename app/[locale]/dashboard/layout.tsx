import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { SkipLink } from "@/components/layout/skip-link";
import { parseTheme } from "@/lib/theme";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const theme = parseTheme((await cookies()).get("theme")?.value);

  return (
    <div className="relative flex min-h-full flex-col bg-ground lg:flex-row">
      <SkipLink />
      <div className="hidden lg:flex">
        <Sidebar userName={session.user.name || session.user.email} theme={theme} />
      </div>
      <MobileNav userName={session.user.name || session.user.email} theme={theme} />
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
