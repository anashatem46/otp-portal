"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Infinity as InfinityIcon,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserPlus,
  UsersRound,
  XCircle
} from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreateUserModal, ResetPasswordModal, AdjustViewsModal } from "@/components/admin/UserDialogs";
import { requestJson } from "@/lib/client-request";
import {
  buttonClass,
  cx,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass
} from "@/components/ui";

export type Account = {
  id: string;
  name: string;
};

export type UserRow = {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  mustChangePassword: boolean;
  joinedAt: string;
  lastActiveAt: string;
  otpAccesses: Array<{
    remainingViews: number;
    account: Account;
  }>;
};

type RoleFilter = "ALL" | "USER" | "ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "DISABLED" | "PENDING";

const USER_AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500"
];

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function displayName(user: UserRow) {
  return user.name?.trim() || user.username;
}

function userInitials(user: UserRow) {
  return displayName(user)
    .split(/[\s._-]+/)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function UserAvatar({ user }: { user: UserRow }) {
  const colorClass = USER_AVATAR_COLORS[hashString(user.id) % USER_AVATAR_COLORS.length];

  return (
    <span
      className={cx(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
        colorClass
      )}
    >
      {userInitials(user)}
    </span>
  );
}

function userViewTotal(user: UserRow) {
  return user.otpAccesses.reduce((sum, access) => sum + access.remainingViews, 0);
}

type UserActionsProps = {
  user: UserRow;
  accounts: Account[];
  busy: boolean;
  onAdjust: (user: UserRow) => void;
  onReset: (user: UserRow) => void;
  onToggle: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
};

function UserBadges({ user }: { user: UserRow }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={cx(
          "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold",
          user.role === "ADMIN"
            ? "bg-violet-100 text-violet-700"
            : "bg-blue-100 text-blue-700"
        )}
      >
        {user.role === "ADMIN" ? "admin" : "user"}
      </span>
      <span
        className={cx(
          "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-xs font-bold",
          user.isActive ? "text-emerald-700" : "text-red-700"
        )}
      >
        <CheckCircle2 size={13} />
        {user.isActive ? "Active" : "Disabled"}
      </span>
      {user.mustChangePassword ? (
        <span className="inline-flex h-6 items-center rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-700">
          Pending
        </span>
      ) : null}
    </div>
  );
}

function UserManagementControls({ user, compact = false, accounts, busy, onAdjust, onReset, onToggle, onDelete }: UserActionsProps & { compact?: boolean }) {
  return (
    <div className={cx("grid gap-3", compact ? "" : "min-w-[520px] grid-cols-[1fr_1fr_auto_auto]")}>
      <button type="button" className={secondaryButtonClass} disabled={busy || accounts.length === 0 || user.role === "ADMIN"} onClick={() => onAdjust(user)}>
        <Eye size={16} /> Adjust views
      </button>

      <button
        type="button"
        className={secondaryButtonClass}
        onClick={() => onReset(user)}
        disabled={busy}
      >
        <RotateCcw size={16} />
        Reset password
      </button>

      <button
        className={user.isActive ? dangerButtonClass : buttonClass}
        onClick={() => onToggle(user)}
        disabled={busy}
      >
        {user.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
        {user.isActive ? "Disable" : "Enable"}
      </button>

      <button
        className={dangerButtonClass}
        onClick={() => onDelete(user)}
        disabled={busy}
        title="Delete user"
      >
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  );
}

function UserStatusCell({ user }: { user: UserRow }) {
  if (user.mustChangePassword) {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-amber-600">
        <Clock3 size={18} />
        Pending
      </span>
    );
  }

  if (!user.isActive) {
    return (
      <span className="inline-flex items-center gap-2 font-semibold text-slate-400">
        <XCircle size={18} />
        Inactive
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
      <CheckCircle2 size={18} />
      Active
    </span>
  );
}

function OtpViewsCell({ user }: { user: UserRow }) {
  if (user.role === "ADMIN") {
    return (
      <span className="inline-flex items-center justify-center font-bold text-moss">
        <InfinityIcon size={20} />
      </span>
    );
  }

  return <span className="font-bold text-ink">{userViewTotal(user)} remaining</span>;
}

function UserActionsMenu({ user, accounts, busy, onAdjust, onReset, onToggle, onDelete }: UserActionsProps) {
  return (
    <details className="relative">
      <summary aria-label={`Actions for ${user.username}`} className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-slate-500 transition hover:bg-field hover:text-ink [&::-webkit-details-marker]:hidden">
        <MoreHorizontal size={20} />
      </summary>
      <div className="absolute right-0 top-10 z-20 w-72 overflow-hidden rounded-lg border border-line bg-white py-2 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
        <button type="button" className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg font-bold text-ink hover:bg-field" onClick={() => onAdjust(user)} disabled={busy || accounts.length === 0 || user.role === "ADMIN"}>
          <Eye size={22} /> Adjust views
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg font-bold text-ink hover:bg-field"
          onClick={() => onToggle(user)}
          disabled={busy}
        >
          <Pencil size={22} className="text-slate-500" />
          {user.isActive ? "Disable user" : "Enable user"}
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg font-bold text-ink hover:bg-field"
          onClick={() => onReset(user)}
          disabled={busy}
        >
          <KeyRound size={22} className="text-slate-500" />
          Reset password
        </button>
        <div className="my-2 border-t border-line" />
        <button
          type="button"
          className="flex w-full items-center gap-4 px-5 py-3 text-left text-lg font-bold text-red-600 hover:bg-red-50"
          onClick={() => onDelete(user)}
          disabled={busy}
        >
          <Trash2 size={22} />
          Remove user
        </button>
      </div>
    </details>
  );
}

export function AdminUsersClient({
  users,
  accounts
}: {
  users: UserRow[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserRow | null>(null);
  const [adjustingUser, setAdjustingUser] = useState<UserRow | null>(null);

  const stats = useMemo(
    () => [
      {
        label: "Total Users",
        value: users.length,
        icon: UsersRound,
        className: "bg-blue-100 text-blue-600"
      },
      {
        label: "Active",
        value: users.filter((user) => user.isActive).length,
        icon: CheckCircle2,
        className: "bg-emerald-100 text-emerald-600"
      },
      {
        label: "Pending",
        value: users.filter((user) => user.mustChangePassword).length,
        icon: Clock3,
        className: "bg-amber-100 text-amber-600"
      },
      {
        label: "Admins",
        value: users.filter((user) => user.role === "ADMIN").length,
        icon: ShieldCheck,
        className: "bg-violet-100 text-violet-600"
      }
    ],
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        displayName(user).toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "DISABLED" && !user.isActive) ||
        (statusFilter === "PENDING" && user.mustChangePassword);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  async function submitJson(
    url: string,
    body: unknown,
    success: string,
    method = "POST"
  ) {
    setError("");
    setMessage("");
    setPending(url);

    try {
      const data = await requestJson<{ access?: { remainingViews: number } }>(url, body, method);
      setMessage(data.access ? `Views adjusted. Remaining views: ${data.access.remainingViews}.` : success);
      startRefresh(() => router.refresh());
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reach the server. Please try again.");
      return false;
    } finally {
      setPending("");
    }
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const role = form.get("role");
    const ok = await submitJson(
      "/api/admin/users",
      {
        name: form.get("name"),
        username: String(form.get("username") ?? "").replace(/^@+/, ""),
        email: form.get("email"),
        temporaryPassword: form.get("temporaryPassword"),
        role,
        isActive: true,
        initialAccess: role === "ADMIN" ? [] : form.getAll("accountId").map((accountId) => ({
          accountId,
          remainingViews: Number(form.get("viewLimit"))
        }))
      },
      "User created."
    );

    if (ok) {
      formElement.reset();
      setShowCreateForm(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>, user: UserRow) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await submitJson(
      `/api/admin/users/${user.id}/reset-password`,
      {
        temporaryPassword: form.get("temporaryPassword")
      },
      "Password reset."
    );

    if (ok) {
      formElement.reset();
      setResettingUser(null);
    }
  }

  function deleteUser(user: UserRow) {
    const confirmed = window.confirm(
      `Delete ${user.username}? This removes their sessions, access rows, and requests.`
    );

    if (!confirmed) {
      return;
    }

    void submitJson(
      `/api/admin/users/${user.id}`,
      undefined,
      "User deleted.",
      "DELETE"
    );
  }

  function toggleUserStatus(user: UserRow) {
    void submitJson(
      `/api/admin/users/${user.id}/status`,
      {
        isActive: !user.isActive
      },
      user.isActive ? "User disabled." : "User enabled."
    );
  }


  const userActions = {
    accounts,
    busy: pending !== "" || refreshing,
    onAdjust: (user: UserRow) => { setError(""); setAdjustingUser(user); },
    onReset: (user: UserRow) => { setError(""); setResettingUser(user); },
    onToggle: toggleUserStatus,
    onDelete: deleteUser
  };

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <section
              key={stat.label}
              className="rounded-lg border border-line bg-white p-4 shadow-panel"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cx(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    stat.className
                  )}
                >
                  <Icon size={20} />
                </span>
                <div>
                  <p className="text-2xl font-bold text-ink">{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {stat.label}
                  </p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
          {message}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-panel">
        <div className="grid gap-3 border-b border-line p-5 lg:grid-cols-[minmax(280px,1fr)_154px_170px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, username, email..."
              className="h-11 w-full rounded-lg border border-line bg-field pl-11 pr-4 text-sm font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/15"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/15"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">Admins</option>
            <option value="USER">Users</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="h-11 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/15"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="PENDING">Pending</option>
          </select>
          <button
            type="button"
            className={cx(buttonClass, "whitespace-nowrap")}
            onClick={() => { setError(""); setShowCreateForm(true); }}
          >
            <UserPlus size={22} />
            <span className="hidden sm:inline">Create user</span>
          </button>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm font-medium text-slate-500">
            No users match the current filters.
          </div>
        ) : (
          <>
            <div className="divide-y divide-line md:hidden">
              {filteredUsers.map((user) => (
                <details key={user.id} className="group">
                  <summary className="list-none cursor-pointer px-4 py-4 [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-line"
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Select ${user.username}`}
                      />
                      <UserAvatar user={user} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-ink">
                              {displayName(user)}
                            </p>
                            <p className="truncate text-xs font-semibold text-slate-500">
                              @{user.username}
                            </p>
                            <p className="truncate text-xs font-semibold text-slate-500">
                              {user.email}
                            </p>
                          </div>
                          <MoreHorizontal
                            size={18}
                            className="mt-0.5 shrink-0 text-slate-500 transition group-open:rotate-90"
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <UserBadges user={user} />
                          <span className="shrink-0 text-moss">
                            {user.role === "ADMIN" ? (
                              <InfinityIcon size={18} />
                            ) : (
                              <span className="text-sm font-bold text-ink">
                                {userViewTotal(user)}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t border-line bg-[#fbfcfd] p-4">
                    <UserManagementControls {...userActions} user={user} compact />
                  </div>
                </details>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1360px] border-collapse text-left">
                <thead className="bg-field text-base font-bold uppercase text-slate-500">
                  <tr>
                    <th className="w-14 px-6 py-5">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-line"
                        aria-label="Select all users"
                      />
                    </th>
                    <th className="px-4 py-5">
                      <span className="inline-flex items-center gap-2">
                        <UsersRound size={18} />
                        User
                      </span>
                    </th>
                    <th className="px-4 py-5">
                      <span className="inline-flex items-center gap-2">
                        <Mail size={18} />
                        Email
                      </span>
                    </th>
                    <th className="px-4 py-5">Role</th>
                    <th className="px-4 py-5">Status</th>
                    <th className="px-4 py-5">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={18} />
                        Joined
                      </span>
                    </th>
                    <th className="px-4 py-5">Last active</th>
                    <th className="px-4 py-5 text-center">
                      <Eye size={18} className="mx-auto" />
                    </th>
                    <th className="px-4 py-5 text-center">OTP views</th>
                    <th className="w-16 px-4 py-5" />
                  </tr>
                </thead>
                <tbody className="text-base">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-line align-middle">
                      <td className="px-6 py-5">
                        <input
                          type="checkbox"
                          className="h-5 w-5 rounded border-line"
                          aria-label={`Select ${user.username}`}
                        />
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-4">
                          <UserAvatar user={user} />
                          <div className="min-w-0">
                            <span className="block font-bold text-ink">
                              {displayName(user)}
                            </span>
                            <span className="block text-base font-semibold text-slate-500">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className={cx(
                            "inline-flex h-7 items-center rounded-full px-3 text-sm font-bold",
                            user.role === "ADMIN"
                              ? "bg-violet-100 text-violet-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {user.role === "ADMIN" ? "admin" : "user"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <UserStatusCell user={user} />
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-500">
                        {user.joinedAt}
                      </td>
                      <td className="px-4 py-5 font-medium text-slate-500">
                        {user.lastActiveAt}
                      </td>
                      <td className="px-4 py-5" />
                      <td className="px-4 py-5">
                        <OtpViewsCell user={user} />
                      </td>
                      <td className="px-4 py-5">
                        <UserActionsMenu {...userActions} user={user} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between border-t border-line px-6 py-4 text-lg font-medium text-slate-500">
                <span>
                  {filteredUsers.length} of {users.length} users
                </span>
                <span>Page 1 of 1</span>
              </div>
            </div>
          </>
        )}
      </section>
      {showCreateForm ? <CreateUserModal accounts={accounts} onSubmit={createUser} onClose={() => setShowCreateForm(false)} pending={pending !== "" || refreshing} error={error} /> : null}
      {resettingUser ? <ResetPasswordModal user={resettingUser} onSubmit={(event) => resetPassword(event, resettingUser)} onClose={() => setResettingUser(null)} pending={pending !== "" || refreshing} error={error} /> : null}
      {adjustingUser ? <AdjustViewsModal user={adjustingUser} accounts={accounts} onClose={() => setAdjustingUser(null)} pending={pending !== "" || refreshing} error={error} onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const ok = await submitJson(`/api/admin/users/${adjustingUser.id}/views`, { accountId: form.get("accountId"), deltaViews: form.get("deltaViews") }, "Views adjusted.");
        if (ok) setAdjustingUser(null);
      }} /> : null}
    </div>
  );
}
