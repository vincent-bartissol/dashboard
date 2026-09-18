import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { DashboardActivityTracker } from "@/components/dashboard/activity-tracker";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { SkipLink } from "@/components/layout/skip-link";
import { isAdminUser } from "@/lib/admin";
import { parseTheme } from "@/lib/theme";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const theme = parseTheme((await cookies()).get("theme")?.value);
  const isAdmin = isAdminUser(session.user);

  return (
    <div className="relative flex min-h-full flex-col bg-ground lg:flex-row">
      <SkipLink />
      <DashboardActivityTracker />
      <div className="hidden lg:flex">
        <Sidebar
          userName={session.user.name || session.user.email}
          theme={theme}
          isAdmin={isAdmin}
        />
      </div>
      <MobileNav
        userName={session.user.name || session.user.email}
        theme={theme}
        isAdmin={isAdmin}
      />
      <div className="min-w-0 flex-1">
        <main id="main" className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
