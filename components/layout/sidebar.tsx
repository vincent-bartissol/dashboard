"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/lib/opendata/datasets";
import { authClient } from "@/lib/auth-client";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { Wordmark } from "@/components/layout/wordmark";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useFavoritesQuery } from "@/lib/favorites-query";
import type { FavoriteDto } from "@/lib/favorites";
import { NAV_PREFETCH_DATASETS } from "@/lib/opendata/nav-prefetch";
import { fetchThemeTablePage, themeTableQueryKey } from "@/lib/opendata/theme-query";
import type { ColorScheme } from "@/lib/theme";

const linkClass = (active: boolean) =>
  `border-l-4 px-3 py-2.5 text-sm transition focus-field ${
    active
      ? "border-accent bg-accent/20 font-medium text-white"
      : "border-transparent text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white"
  }`;

const mobileLinkClass = (active: boolean) =>
  `shrink-0 rounded-none border-b-2 px-3 py-1.5 text-sm focus-field ${
    active ? "border-accent text-white" : "border-transparent bg-white/5 text-white/80"
  }`;

function useLogout() {
  const router = useRouter();
  return async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };
}

export function Sidebar({
  userName,
  theme,
  isAdmin = false,
  initialFavorites = [],
}: Readonly<{
  userName: string;
  theme: ColorScheme;
  isAdmin?: boolean;
  initialFavorites?: FavoriteDto[];
}>) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const favorites = useFavoritesQuery(initialFavorites);
  const favoriteCount = favorites.data?.length ?? 0;
  const queryClient = useQueryClient();

  function prefetchNav(href: string) {
    const datasets = NAV_PREFETCH_DATASETS[href];
    if (!datasets?.length) return;
    // Table page only — marker catalogs are large and burn the theme rate limit.
    for (const datasetId of datasets) {
      void queryClient.prefetchInfiniteQuery({
        queryKey: themeTableQueryKey(datasetId),
        queryFn: ({ pageParam, signal }) =>
          fetchThemeTablePage(datasetId, { offset: pageParam, signal }),
        initialPageParam: 0,
        getNextPageParam: (last: { hasMore: boolean; nextOffset: number }) =>
          last.hasMore ? last.nextOffset : undefined,
        staleTime: 60_000,
      });
    }
  }

  const logout = useLogout();

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col self-start border-r border-white/10 bg-navy text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <Wordmark invert />
        <p className="mt-4 truncate border-l-4 border-accent pl-3 text-sm font-medium text-white">
          {userName}
        </p>
        <div className="mt-3">
          <CommandPalette />
        </div>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const showBadge = item.id === "favorites" && favoriteCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={linkClass(active)}
              onPointerEnter={() => prefetchNav(item.href)}
            >
              <span className="flex items-center justify-between gap-2">
                <span>{t(item.id)}</span>
                {showBadge ? (
                  <span className="tabular-nums text-xs text-white/70">{favoriteCount}</span>
                ) : null}
              </span>
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
  initialFavorites = [],
}: Readonly<{
  userName: string;
  theme: ColorScheme;
  isAdmin?: boolean;
  initialFavorites?: FavoriteDto[];
}>) {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const favorites = useFavoritesQuery(initialFavorites);
  const favoriteCount = favorites.data?.length ?? 0;
  const logout = useLogout();

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
          const showBadge = item.id === "favorites" && favoriteCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={mobileLinkClass(active)}
            >
              {t(item.id)}
              {showBadge ? ` (${favoriteCount})` : ""}
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
