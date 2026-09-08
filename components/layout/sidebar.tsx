"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/opendata/datasets";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Paris Ouverte
        </Link>
        <p className="mt-1 truncate text-sm text-white/70">{userName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-2 text-sm transition ${
                active ? "bg-white text-navy" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="border-b border-navy/20 bg-navy text-white lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          Paris Ouverte
        </Link>
        <button type="button" onClick={logout} className="text-sm text-white/80">
          Sortir
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 pb-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                active ? "bg-white text-navy" : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <p className="sr-only">{userName}</p>
    </div>
  );
}
