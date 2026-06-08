import { Role } from "@prisma/client";
import { KeyRound, LayoutDashboard, ListChecks, ScrollText, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/session";
import { LogoutButton } from "@/components/layout/LogoutButton";

const userNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: ListChecks }
];

const adminNav = [
  { href: "/admin", label: "Admin", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/accounts", label: "Accounts", icon: KeyRound },
  { href: "/admin/requests", label: "Reviews", icon: Settings },
  { href: "/admin/audit-logs", label: "Audit", icon: ScrollText }
];

export function AppShell({
  user,
  children
}: {
  user: AuthenticatedUser;
  children: ReactNode;
}) {
  const nav = user.role === Role.ADMIN ? [...userNav, ...adminNav] : userNav;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-moss text-white">
                <KeyRound size={20} />
              </span>
              <span>
                <span className="block text-base font-semibold">OTP Sharing Portal</span>
                <span className="block text-xs text-slate-500">
                  {user.username} - {user.role.toLowerCase()}
                </span>
              </span>
            </Link>
            <LogoutButton />
          </div>
          <nav className="flex gap-2 overflow-x-auto">
            {nav.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded border border-line bg-field px-3 text-sm font-medium text-ink hover:bg-white"
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
