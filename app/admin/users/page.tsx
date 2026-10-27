import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/db";
import { requirePageAdmin } from "@/lib/page-auth";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatLastActive(date?: Date) {
  if (!date) return "Never";

  const elapsed = Date.now() - date.getTime();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (elapsed < day) {
    const hours = Math.max(1, Math.round(elapsed / hour));
    return hours >= 12 ? "Today" : `${hours}h ago`;
  }

  const days = Math.round(elapsed / day);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.round(days / 7)}w ago`;
  return `${Math.round(days / 30)}mo ago`;
}

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
        },
        sessions: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            createdAt: true
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
        <h1 className="hidden text-2xl font-bold text-ink sm:block">Users</h1>
        <p className="text-base font-semibold text-slate-500 sm:mt-2 sm:text-lg">
          Manage portal users and permissions.
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
          joinedAt: formatDate(row.createdAt),
          lastActiveAt: formatLastActive(row.sessions[0]?.createdAt),
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
