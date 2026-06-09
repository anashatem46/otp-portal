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
      category: true,
      sharedByLabel: true,
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
      <DashboardClient
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          category: account.category ?? undefined,
          sharedByLabel: account.sharedByLabel ?? undefined,
          remainingViews: account.otpAccesses[0]?.remainingViews ?? 0,
          isUnlimited: user.role === Role.ADMIN
        }))}
      />
    </AppShell>
  );
}
