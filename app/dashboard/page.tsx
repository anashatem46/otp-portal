import { Role } from "@prisma/client";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardClient } from "@/components/otp/DashboardClient";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";

export default async function DashboardPage() {
  const user = await requirePageUser();
  const accounts = await prisma.sharedAccount.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      otpAccesses: {
        where: {
          userId: user.id
        },
        select: {
          remainingViews: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          View shared account codes and request more access.
        </p>
      </div>
      <DashboardClient
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          remainingViews: account.otpAccesses[0]?.remainingViews ?? 0,
          isUnlimited: user.role === Role.ADMIN
        }))}
      />
    </AppShell>
  );
}
