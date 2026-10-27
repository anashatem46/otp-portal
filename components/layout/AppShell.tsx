"use client";

import { Role } from "@prisma/client";
import {
  Bell,
  ClipboardList,
  FileText,
  Leaf,
  LayoutGrid,
  Menu,
  Settings,
  ShieldCheck,
  UsersRound,
  WalletCards,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/session";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { cx } from "@/components/ui";

const dashboardNav = { href: "/dashboard", label: "Dashboard", icon: LayoutGrid };

const userNav = [dashboardNav, { href: "/requests", label: "Requests", icon: ClipboardList }];

const adminNav = [
  dashboardNav,
  { href: "/admin/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin", label: "Admin", icon: ShieldCheck, exact: true },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/accounts", label: "Accounts", icon: WalletCards },
  { href: "/admin/audit-logs", label: "Audit", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-moss text-sm font-bold text-white">
      {initial}
    </span>
  );
}

export function AppShell({
  user,
  children
}: {
  user: AuthenticatedUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = user.role === Role.ADMIN ? adminNav : userNav;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/requests") return pathname === "/requests";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <header className="sticky top-0 z-30 border-b border-line bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-white">
              <Leaf size={17} />
            </span>
            <span className="text-base font-bold text-ink">OTP Sharing Portal</span>
          </Link>

          <div className="ml-auto hidden shrink-0 items-center gap-3 md:flex">
            <button
              type="button"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-field hover:text-ink"
              title="Notifications"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            <div className="flex items-center gap-2 rounded-xl bg-[#edf4ef] px-3 py-1.5">
              <UserAvatar name={user.username} />
              <span className="text-sm">
                <span className="font-bold text-ink">{user.username}</span>
                <span className="px-1.5 text-slate-400">·</span>
                <span className="text-slate-500">{user.role.toLowerCase()}</span>
              </span>
            </div>
            <LogoutButton />
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-field md:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            title={menuOpen ? "Close navigation" : "Open navigation"}
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        <div className="hidden border-t border-line md:block">
          <nav className="mx-auto flex h-12 max-w-[1360px] items-center gap-2 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, (item as { exact?: boolean }).exact);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "relative inline-flex h-full items-center gap-2 px-3 text-sm font-semibold transition-colors",
                    active ? "nav-tab-active" : "text-slate-500 hover:text-ink"
                  )}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {menuOpen ? (
          <div className="border-t border-line bg-white px-4 py-3 md:hidden">
            <nav className="grid gap-1">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, (item as { exact?: boolean }).exact);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cx(
                      "inline-flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                      active
                        ? "bg-[#edf4ef] text-moss"
                        : "text-slate-600 hover:bg-field hover:text-ink"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <div className="flex items-center gap-2">
                <UserAvatar name={user.username} />
                <span className="text-sm font-semibold text-ink">{user.username}</span>
              </div>
              <LogoutButton />
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-[1360px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
