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

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Request Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve or reject additional OTP view requests.
        </p>
      </div>
      <AdminRequestsClient
        requests={requests.map((request) => ({
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
    </AppShell>
  );
}
