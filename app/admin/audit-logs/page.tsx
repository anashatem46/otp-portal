import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { inputClass, secondaryButtonClass } from "@/components/ui";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

type SearchParams = {
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
};

export default async function AdminAuditLogsPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageAdmin();
  const [users, logs] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        username: "asc"
      },
      select: {
        id: true,
        username: true,
        email: true
      }
    }),
    prisma.auditLog.findMany({
      where: {
        action: searchParams.action || undefined,
        OR: searchParams.userId
          ? [{ userId: searchParams.userId }, { adminId: searchParams.userId }]
          : undefined,
        createdAt:
          searchParams.from || searchParams.to
            ? {
                gte: searchParams.from ? new Date(searchParams.from) : undefined,
                lte: searchParams.to ? new Date(searchParams.to) : undefined
              }
            : undefined
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        admin: {
          select: {
            username: true,
            email: true
          }
        },
        account: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    })
  ]);

  return (
    <AppShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Search sensitive actions across users, admins, and accounts.
        </p>
      </div>

      <form className="mb-4 grid gap-3 rounded border border-line bg-white p-4 shadow-panel lg:grid-cols-[1fr_1fr_160px_160px_auto]">
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          Action
          <select className={inputClass} name="action" defaultValue={searchParams.action ?? ""}>
            <option value="">All actions</option>
            {Object.values(AUDIT_ACTIONS).map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          User or admin
          <select className={inputClass} name="userId" defaultValue={searchParams.userId ?? ""}>
            <option value="">All users</option>
            {users.map((row) => (
              <option key={row.id} value={row.id}>
                {row.username} ({row.email})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          From
          <input className={inputClass} name="from" type="date" defaultValue={searchParams.from ?? ""} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-slate-700">
          To
          <input className={inputClass} name="to" type="date" defaultValue={searchParams.to ?? ""} />
        </label>
        <button className={secondaryButtonClass}>
          <Search size={16} />
          Search
        </button>
      </form>

      <section className="overflow-hidden rounded border border-line bg-white shadow-panel">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-field text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Admin</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-line align-top">
                <td className="px-4 py-3 text-slate-600">{log.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3">{log.user?.username ?? "none"}</td>
                <td className="px-4 py-3">{log.admin?.username ?? "none"}</td>
                <td className="px-4 py-3">{log.account?.name ?? "none"}</td>
                <td className="px-4 py-3">{log.ipAddress ?? "none"}</td>
                <td className="max-w-sm px-4 py-3">
                  <code className="block whitespace-pre-wrap rounded bg-field p-2 text-xs">
                    {JSON.stringify(log.metadata ?? {}, null, 2)}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
