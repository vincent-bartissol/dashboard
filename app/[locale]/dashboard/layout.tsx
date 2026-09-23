import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DashboardActivityTracker } from "@/components/dashboard/activity-tracker";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { SkipLink } from "@/components/layout/skip-link";
import { QueryProvider } from "@/components/query-provider";
import { isAdminUser } from "@/lib/admin";
import { listFavorites } from "@/lib/db/queries";
import { toFavoriteDtos } from "@/lib/favorites";
import { parseTheme } from "@/lib/theme";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const theme = parseTheme((await cookies()).get("theme")?.value);
  const isAdmin = isAdminUser(session.user);
  const initialFavorites = toFavoriteDtos(await listFavorites(session.user.id));

  return (
    <QueryProvider>
      <div className="relative flex min-h-full flex-col bg-ground lg:flex-row">
        <SkipLink />
        <DashboardActivityTracker />
        <div className="hidden lg:flex">
          <Sidebar
            userName={session.user.name || session.user.email}
            theme={theme}
            isAdmin={isAdmin}
            initialFavorites={initialFavorites}
          />
        </div>
        <MobileNav
          userName={session.user.name || session.user.email}
          theme={theme}
          isAdmin={isAdmin}
          initialFavorites={initialFavorites}
        />
        <div className="min-w-0 flex-1">
          <main id="main" className="mx-auto max-w-6xl px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </QueryProvider>
  );
}
