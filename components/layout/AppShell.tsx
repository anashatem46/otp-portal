"use client";

import { Role } from "@prisma/client";
import {
  Bell,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  ScrollText,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/session";
import { LogoutButton } from "@/components/layout/LogoutButton";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: ListChecks }
];

const adminNav = [
  { href: "/admin", label: "Admin", icon: ShieldCheck, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/accounts", label: "Accounts", icon: KeyRound },
  { href: "/admin/requests", label: "Reviews", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit", icon: ScrollText }
];

function UserAvatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss text-sm font-semibold text-white">
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
  const nav = user.role === Role.ADMIN ? [...userNav, ...adminNav] : userNav;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/requests") return pathname === "/requests";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-moss text-white">
              <KeyRound size={16} />
            </span>
            <span className="text-sm font-semibold text-ink">OTP Sharing Portal</span>
          </Link>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, (item as { exact?: boolean }).exact);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-3.5 text-[13px] transition-colors ${
                    active
                      ? "nav-tab-active"
                      : "font-medium text-slate-500 hover:text-ink"
                  }`}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: bell + avatar + user info */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-field hover:text-ink"
              title="Notifications"
            >
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2">
              <UserAvatar name={user.username} />
              <span className="hidden text-sm sm:block">
                <span className="font-medium text-ink">{user.username}</span>
                <span className="text-slate-400"> · </span>
                <span className="text-slate-500">{user.role.toLowerCase()}</span>
              </span>
            </div>

            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
