import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

export default async function AdminUsersPage() {
  const user = await requirePageAdmin();
  const [users, accounts] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        username: "asc"
      },
      include: {
        otpAccesses: {
          include: {
            account: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.sharedAccount.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    })
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create users, reset passwords, change status, and adjust OTP views.
        </p>
      </div>
      <AdminUsersClient
        users={users.map((row) => ({
          id: row.id,
          name: row.name,
          username: row.username,
          email: row.email,
          role: row.role,
          isActive: row.isActive,
          mustChangePassword: row.mustChangePassword,
          otpAccesses: row.otpAccesses.map((access) => ({
            remainingViews: access.remainingViews,
            account: access.account
          }))
        }))}
        accounts={accounts}
      />
    </AppShell>
  );
}
