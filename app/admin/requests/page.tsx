import { AdminRequestsClient } from "@/components/admin/AdminRequestsClient";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const user = await requirePageAdmin();
  const requests = await prisma.accessRequest.findMany({
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
    orderBy: [
      {
        status: "asc"
      },
      {
        createdAt: "desc"
      }
    ]
  });
  const currentAccessRows =
    requests.length === 0
      ? []
      : await prisma.otpAccess.findMany({
          where: {
            OR: requests.map((request) => ({
              userId: request.userId,
              accountId: request.accountId
            }))
          },
          select: {
            userId: true,
            accountId: true,
            remainingViews: true
          }
        });
  const currentAccessByRequest = new Map(
    currentAccessRows.map((access) => [
      `${access.userId}:${access.accountId}`,
      access.remainingViews
    ])
  );

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-ink">Requests</h1>
        <p className="mt-2 text-base font-semibold text-slate-500">
          Review and manage access requests.
        </p>
      </div>
      <AdminRequestsClient
        requests={requests.map((request) => ({
          id: request.id,
          requestedViews: request.requestedViews,
          currentViews:
            currentAccessByRequest.get(`${request.userId}:${request.accountId}`) ?? null,
          reason: request.reason,
          status: request.status,
          createdAt: request.createdAt.toLocaleString(),
          reviewedAt: request.reviewedAt?.toLocaleString() ?? null,
          user: request.user,
          account: request.account,
          reviewer: request.reviewer
        }))}
      />
    </AppShell>
  );
}
