import type { ReactNode } from "react";
import { DashboardActivityTracker } from "@/components/dashboard/activity-tracker";
import { NotificationProvider } from "@/components/dashboard/notifications";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { Reveal } from "@/components/ui/reveal";
import { SkipLink } from "@/components/layout/skip-link";
import { QueryProvider } from "@/components/query-provider";
import { DemoBanner } from "@/components/demo/demo-banner";
import { DemoProvider } from "@/components/demo/demo-provider";
import { getBuildSession } from "@/lib/demo/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = getBuildSession();
  const isAdmin = session.user.role === "admin";

  return (
    <DemoProvider>
      <QueryProvider>
        <NotificationProvider>
          <div className="relative flex min-h-full flex-col bg-ground lg:flex-row">
            <div className="w-full lg:hidden">
              <DemoBanner />
            </div>
            <SkipLink />
            <DashboardActivityTracker />
            <div className="hidden lg:flex">
              <Sidebar
                userName={session.user.name || session.user.email}
                theme="system"
                isAdmin={isAdmin}
                initialFavorites={[]}
              />
            </div>
            <MobileNav
              userName={session.user.name || session.user.email}
              theme="system"
              isAdmin={isAdmin}
              initialFavorites={[]}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="hidden lg:block">
                <DemoBanner />
              </div>
              <Reveal className="flex-1 p-4 sm:p-6 lg:p-8">{children}</Reveal>
            </div>
          </div>
        </NotificationProvider>
      </QueryProvider>
    </DemoProvider>
  );
}
