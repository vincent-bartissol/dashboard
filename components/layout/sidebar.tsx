"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/lib/opendata/datasets";
import { authClient } from "@/lib/auth-client";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { Wordmark } from "@/components/layout/wordmark";import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { ColorScheme } from "@/lib/theme";

const linkClass = (active: boolean) =>
  `border-l-4 px-3 py-2 text-sm transition focus-field ${
    active
      ? "border-accent bg-white/10 font-medium text-white"
      : "border-transparent text-white/75 hover:bg-white/5 hover:text-white"
  }`;

const mobileLinkClass = (active: boolean) =>
  `shrink-0 rounded-none border-b-2 px-3 py-1.5 text-sm focus-field ${
    active ? "border-accent text-white" : "border-transparent bg-white/5 text-white/80"
  }`;

export function Sidebar({
  userName,
  theme,
  isAdmin = false,
}: {
  userName: string;
  theme: ColorScheme;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Wordmark invert />
        <p className="mt-3 truncate text-sm text-white/70">{userName}</p>
        <div className="mt-3">
          <CommandPalette />
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={linkClass(active)}
            >
              {t(item.id)}
            </Link>
          );
        })}
        {isAdmin ? (
          <Link
            href="/dashboard/admin"
            aria-current={pathname.startsWith("/dashboard/admin") ? "page" : undefined}
            className={linkClass(pathname.startsWith("/dashboard/admin"))}
          >
            {t("admin")}
          </Link>
        ) : null}
      </nav>
      <div className="space-y-2 p-3">
        <LocaleSwitcher invert />
        <ThemeToggle invert initial={theme} />
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-none border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 focus-field"
        >
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({
  userName,
  theme,
  isAdmin = false,
}: {
  userName: string;
  theme: ColorScheme;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Nav");

  async function logout() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="border-b border-navy/20 bg-navy text-white lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Wordmark invert />
        <div className="flex items-center gap-2">
          <CommandPalette />
          <LocaleSwitcher invert />
          <ThemeToggle invert initial={theme} />
          <button type="button" onClick={logout} className="text-sm text-white/80 focus-field">
            {t("logoutShort")}
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={mobileLinkClass(active)}
            >
              {t(item.id)}
            </Link>
          );
        })}
        {isAdmin ? (
          <Link
            href="/dashboard/admin"
            aria-current={pathname.startsWith("/dashboard/admin") ? "page" : undefined}
            className={mobileLinkClass(pathname.startsWith("/dashboard/admin"))}
          >
            {t("admin")}
          </Link>
        ) : null}
      </nav>
      <p className="sr-only">{userName}</p>
    </div>
  );
}
