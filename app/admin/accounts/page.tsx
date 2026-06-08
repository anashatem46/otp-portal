import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

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
          accessRequests: true
        }
      }
    }
  });

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Shared Accounts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add encrypted TOTP accounts and inspect access coverage.
        </p>
      </div>
      <AdminAccountsClient
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          isActive: account.isActive,
          createdAt: account.createdAt.toLocaleString(),
          _count: account._count
        }))}
      />
    </AppShell>
  );
}
