import { Clock, KeyRound, ListChecks, Users } from "lucide-react";
import Link from "next/link";
import { AdminRequestsClient } from "@/components/admin/AdminRequestsClient";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const user = await requirePageAdmin();
  const [users, accounts, pendingRequests, pendingRequestRows, recentLogs] = await Promise.all([
    prisma.user.count(),
    prisma.sharedAccount.count(),
    prisma.accessRequest.count({
      where: {
        status: "PENDING"
      }
    }),
    prisma.accessRequest.findMany({
      where: {
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        account: {
          select: {
            name: true
          }
        },
        reviewer: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    }),
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 6,
      include: {
        user: {
          select: {
            username: true
          }
        },
        admin: {
          select: {
            username: true
          }
        },
        account: {
          select: {
            name: true
          }
        }
      }
    })
  ]);

  const cards = [
    { label: "Users", value: users, href: "/admin/users", icon: Users },
    { label: "Accounts", value: accounts, href: "/admin/accounts", icon: KeyRound },
    { label: "Pending", value: pendingRequests, href: "/admin/requests", icon: ListChecks }
  ];

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Operational overview and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              href={card.href}
              key={card.label}
              className="rounded border border-line bg-white p-4 shadow-panel hover:border-moss/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{card.label}</span>
                <Icon size={18} className="text-moss" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks size={18} className="text-moss" />
            <h2 className="font-semibold">Pending Requests</h2>
          </div>
          <Link href="/admin/requests" className="text-sm font-medium text-moss hover:underline">
            View all
          </Link>
        </div>
        {pendingRequestRows.length > 0 ? (
          <AdminRequestsClient
            requests={pendingRequestRows.map((request) => ({
              id: request.id,
              requestedViews: request.requestedViews,
              reason: request.reason,
              status: request.status,
              createdAt: request.createdAt.toLocaleString(),
              reviewedAt: request.reviewedAt?.toLocaleString() ?? null,
              user: request.user,
              account: request.account,
              reviewer: request.reviewer
            }))}
          />
        ) : (
          <EmptyState>No pending requests.</EmptyState>
        )}
      </section>

      <section className="mt-6 rounded border border-line bg-white shadow-panel">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Clock size={16} className="text-moss" />
          <h2 className="font-semibold">Recent Audit Events</h2>
        </div>
        <div className="divide-y divide-line">
          {recentLogs.map((log) => (
            <div key={log.id} className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[180px_1fr_180px]">
              <span className="font-medium">{log.action}</span>
              <span className="text-slate-600">
                {log.user?.username ?? log.admin?.username ?? "system"}
                {log.account ? ` - ${log.account.name}` : ""}
              </span>
              <span className="text-slate-500">{log.createdAt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
