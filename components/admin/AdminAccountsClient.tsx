"use client";

import { KeyRound, Plus, Save, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buttonClass,
  dangerButtonClass,
  inputClass,
  secondaryButtonClass,
  StatusBadge
} from "@/components/ui";

type AccountRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    otpAccesses: number;
    accessRequests: number;
  };
};

export function AdminAccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");

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

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await submitJson(
      "/api/admin/accounts",
      {
        name: form.get("name"),
        totpSecret: form.get("totpSecret"),
        initialViewsForExistingUsers: form.get("initialViewsForExistingUsers"),
        isActive: form.get("isActive") === "on"
      },
      "Account created."
    );

    if (ok) {
      formElement.reset();
    }
  }

  async function updateAccount(
    event: FormEvent<HTMLFormElement>,
    accountId: string,
    success = "Account updated."
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    await submitJson(
      `/api/admin/accounts/${accountId}`,
      {
        name: form.get("name"),
        totpSecret: form.get("totpSecret"),
        isActive: form.get("isActive") === "on"
      },
      success,
      "PATCH"
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded border border-line bg-white p-4 shadow-panel">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={18} className="text-moss" />
          <h2 className="font-semibold">Add Shared Account</h2>
        </div>
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_120px]" onSubmit={createAccount}>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Account name
            <input className={inputClass} name="name" required />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            TOTP secret
            <input className={inputClass} name="totpSecret" required />
          </label>
          <label className="grid gap-1 text-xs font-medium text-slate-700">
            Initial views
            <input
              className={inputClass}
              name="initialViewsForExistingUsers"
              type="number"
              min={0}
              max={1000}
              defaultValue={1}
              required
            />
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium">
            <input name="isActive" type="checkbox" defaultChecked />
            Active
          </label>
          <div className="lg:col-span-4">
            <button className={buttonClass} disabled={pending !== ""}>
              <Plus size={16} />
              {pending === "/api/admin/accounts" ? "Creating" : "Create account"}
            </button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-sky-800">{message}</p> : null}
      </section>

      <section className="overflow-hidden rounded border border-line bg-white shadow-panel">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="bg-field text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Edit</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Access rows</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-line align-top">
                <td className="px-4 py-3">
                  <form
                    className="grid gap-2"
                    onSubmit={(event) => updateAccount(event, account.id)}
                  >
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <label className="grid gap-1 text-xs font-medium text-slate-700">
                        Name
                        <input
                          className={inputClass}
                          name="name"
                          defaultValue={account.name}
                          required
                        />
                      </label>
                      <label className="grid gap-1 text-xs font-medium text-slate-700">
                        New TOTP secret
                        <input
                          className={inputClass}
                          name="totpSecret"
                          placeholder="Leave blank"
                        />
                      </label>
                      <label className="flex items-end gap-2 pb-2 text-sm font-medium">
                        <input
                          name="isActive"
                          type="checkbox"
                          defaultChecked={account.isActive}
                        />
                        Active
                      </label>
                    </div>
                    <button
                      className={secondaryButtonClass}
                      disabled={pending !== ""}
                      title="Save account"
                    >
                      <Save size={16} />
                      Save
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={account.isActive ? "green" : "gray"}>
                    {account.isActive ? "active" : "inactive"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">{account._count.otpAccesses}</td>
                <td className="px-4 py-3">{account._count.accessRequests}</td>
                <td className="px-4 py-3 text-slate-600">{account.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <button
                      className={secondaryButtonClass}
                      disabled={pending !== ""}
                      onClick={() =>
                        void submitJson(
                          `/api/admin/accounts/${account.id}`,
                          {
                            name: account.name,
                            totpSecret: "",
                            isActive: !account.isActive
                          },
                          account.isActive ? "Account inactivated." : "Account activated.",
                          "PATCH"
                        )
                      }
                      title={account.isActive ? "Inactivate account" : "Activate account"}
                    >
                      {account.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                      {account.isActive ? "Inactive" : "Activate"}
                    </button>
                    <button
                      className={dangerButtonClass}
                      disabled={pending !== ""}
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Delete ${account.name}? This removes its OTP access rows and requests.`
                        );

                        if (!confirmed) {
                          return;
                        }

                        void submitJson(
                          `/api/admin/accounts/${account.id}`,
                          undefined,
                          "Account deleted.",
                          "DELETE"
                        );
                      }}
                      title="Delete account"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
