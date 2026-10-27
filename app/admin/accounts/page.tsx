import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default async function AdminAccountsPage() {
  const user = await requirePageAdmin();
  const accounts = await prisma.sharedAccount.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      _count: {
        select: {
          otpAccesses: true,
          accessRequests: true,
          auditLogs: true
        }
      }
    }
  });

  return (
    <AppShell user={user}>
      <div>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-ink">Accounts</h1>
          <p className="mt-2 text-base font-semibold text-slate-500">
            All connected accounts and credentials.
          </p>
        </div>
        <AdminAccountsClient
          accounts={accounts.map((account) => ({
            id: account.id,
            name: account.name,
            category: account.category,
            sharedByLabel: account.sharedByLabel,
            isActive: account.isActive,
            createdAt: formatDate(account.createdAt),
            _count: account._count
          }))}
        />
      </div>
    </AppShell>
  );
}
