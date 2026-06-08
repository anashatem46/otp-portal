"use client";

import { Plus, RotateCcw, Shield, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import {
  buttonClass,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
  StatusBadge
} from "@/components/ui";

type Account = {
  id: string;
  name: string;
};

type UserRow = {
  id: string;
  name: string | null;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  mustChangePassword: boolean;
  otpAccesses: Array<{
    remainingViews: number;
    account: Account;
  }>;
};

export function AdminUsersClient({
  users,
  accounts
}: {
  users: UserRow[];
  accounts: Account[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");

  const defaultAccess = useMemo(
    () =>
      Object.fromEntries(accounts.map((account) => [account.id, 1])) as Record<
        string,
        number
      >,
    [accounts]
  );
  const [initialAccess, setInitialAccess] = useState(defaultAccess);

  async function submitJson(
    url: string,
    body: unknown,
    success: string,
    method = "POST"
  ) {
    setError("");
    setMessage("");
    setPending(url);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Request failed.");
      setPending("");
      return false;
    }

    setMessage(success);
    setPending("");
    router.refresh();
    return true;
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await submitJson(
      "/api/admin/users",
      {
        name: form.get("name"),
        username: form.get("username"),
        temporaryPassword: form.get("temporaryPassword"),
        role: form.get("role"),
        isActive: form.get("isActive") === "on",
        initialAccess: Object.entries(initialAccess).map(([accountId, remainingViews]) => ({
          accountId,
          remainingViews
        }))
      },
      "User created."
    );

    if (ok) {
      formElement.reset();
      setInitialAccess(defaultAccess);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="rounded border border-line bg-white p-4 shadow-panel">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-moss" />
          <h2 className="font-semibold">Create User</h2>
        </div>
        <form className="grid gap-3" onSubmit={createUser}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1 text-xs font-medium text-slate-700">
              Name
              <input className={inputClass} name="name" />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-700">
              Username
              <input className={inputClass} name="username" required />
            </label>
            <label className="grid gap-1 text-xs font-medium text-slate-700">
              Temporary password
              <PasswordInput name="temporaryPassword" minLength={8} required />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-[180px_160px_1fr]">
            <label className="grid gap-1 text-xs font-medium text-slate-700">
              Role
              <select className={inputClass} name="role" defaultValue="USER">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>
            <div className="grid gap-2 rounded border border-line bg-field p-3">
              <span className="text-xs font-semibold uppercase text-slate-600">Initial views</span>
              <div className="grid gap-2 md:grid-cols-3">
                {accounts.map((account) => (
                  <label key={account.id} className="grid gap-1 text-xs font-medium text-slate-700">
                    {account.name}
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={1000}
                      value={initialAccess[account.id] ?? 0}
                      onChange={(event) =>
                        setInitialAccess((current) => ({
                          ...current,
                          [account.id]: Number(event.target.value)
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className={buttonClass} disabled={pending !== ""}>
            <Plus size={16} />
            Create user
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-sky-800">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded border border-line bg-white shadow-panel">
        <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
          <thead className="bg-field text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Adjust</th>
              <th className="px-4 py-3">Reset</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Delete</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  <span className="block font-medium">{user.username}</span>
                  <span className="block text-xs text-slate-500">{user.email}</span>
                  {user.name ? <span className="block text-xs text-slate-500">{user.name}</span> : null}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={user.role === "ADMIN" ? "blue" : "gray"}>
                    {user.role.toLowerCase()}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <StatusBadge tone={user.isActive ? "green" : "red"}>
                      {user.isActive ? "active" : "disabled"}
                    </StatusBadge>
                    {user.mustChangePassword ? (
                      <StatusBadge tone="yellow">password change</StatusBadge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    {accounts.map((account) => {
                      const access = user.otpAccesses.find(
                        (row) => row.account.id === account.id
                      );

                      return (
                        <span key={account.id} className="text-xs text-slate-700">
                          {account.name}:{" "}
                          <strong>{access?.remainingViews ?? 0}</strong>
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <form
                    className="grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      void submitJson(
                        `/api/admin/users/${user.id}/views`,
                        {
                          accountId: form.get("accountId"),
                          deltaViews: form.get("deltaViews")
                        },
                        "Views adjusted."
                      );
                    }}
                  >
                    <select className={inputClass} name="accountId">
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <input className={inputClass} name="deltaViews" type="number" defaultValue={1} />
                    <button className={secondaryButtonClass} disabled={pending !== ""}>
                      Apply
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <form
                    className="grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formElement = event.currentTarget;
                      const form = new FormData(formElement);
                      void submitJson(
                        `/api/admin/users/${user.id}/reset-password`,
                        {
                          temporaryPassword: form.get("temporaryPassword")
                        },
                        "Password reset."
                      );
                      formElement.reset();
                    }}
                  >
                    <PasswordInput
                      name="temporaryPassword"
                      minLength={8}
                      required
                    />
                    <button className={secondaryButtonClass} disabled={pending !== ""}>
                      <RotateCcw size={16} />
                      Reset
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <button
                    className={user.isActive ? dangerButtonClass : buttonClass}
                    onClick={() =>
                      void submitJson(
                        `/api/admin/users/${user.id}/status`,
                        {
                          isActive: !user.isActive
                        },
                        user.isActive ? "User disabled." : "User enabled."
                      )
                    }
                    disabled={pending !== ""}
                  >
                    {user.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    className={dangerButtonClass}
                    onClick={() => {
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
                    }}
                    disabled={pending !== ""}
                    title="Delete user"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
