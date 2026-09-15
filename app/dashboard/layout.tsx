import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireSession();

  return (
    <div className="flex min-h-full flex-col bg-ground lg:flex-row">
      <div className="hidden lg:flex">
        <Sidebar userName={session.user.name || session.user.email} />
      </div>
      <MobileNav userName={session.user.name || session.user.email} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
