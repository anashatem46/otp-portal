import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, StatusBadge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";

export default async function RequestsPage() {
  const user = await requirePageUser();
  const requests = await prisma.accessRequest.findMany({
    where: {
      userId: user.id
    },
    include: {
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
    }
  });

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Access Requests</h1>
        <p className="mt-1 text-sm text-slate-600">Your submitted OTP view requests.</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState>No requests yet.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded border border-line bg-white shadow-panel">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-field text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Reviewed by</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{request.account.name}</td>
                  <td className="px-4 py-3">{request.requestedViews}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={
                        request.status === "APPROVED"
                          ? "green"
                          : request.status === "REJECTED"
                            ? "red"
                            : "yellow"
                      }
                    >
                      {request.status.toLowerCase()}
                    </StatusBadge>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">{request.reason}</td>
                  <td className="px-4 py-3">{request.reviewer?.username ?? "none"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {request.createdAt.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
