"use client";

import {
  CheckCircle2,
  Copy,
  Infinity as InfinityIcon,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  WalletCards,
  XCircle
} from "lucide-react";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreateAccountModal, AccountEditForm } from "@/components/admin/AccountForms";
import { requestJson } from "@/lib/client-request";
import {
  AccountAvatar,
  buttonClass,
  CategoryBadge,
  cx,
  dangerButtonClass,
  secondaryButtonClass
} from "@/components/ui";

export type AccountRow = {
  id: string;
  name: string;
  category: string | null;
  sharedByLabel: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    otpAccesses: number;
    accessRequests: number;
    auditLogs?: number;
  };
};


export function AdminAccountsClient({ accounts }: { accounts: AccountRow[] }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");
  const [search, setSearch] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;

    return accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(query) ||
        account.category?.toLowerCase().includes(query) ||
        account.sharedByLabel?.toLowerCase().includes(query)
    );
  }, [accounts, search]);

  const stats = useMemo(
    () => [
      {
        label: "Total Accounts",
        value: accounts.length.toLocaleString(),
        icon: WalletCards,
        className: "text-blue-600"
      },
      {
        label: "Active Users",
        value: accounts
          .reduce((sum, account) => sum + account._count.otpAccesses, 0)
          .toLocaleString(),
        icon: CheckCircle2,
        className: "text-emerald-600"
      },
      {
        label: "Total Views",
        value: accounts
          .reduce((sum, account) => sum + (account._count.auditLogs ?? 0), 0)
          .toLocaleString(),
        icon: KeyRound,
        className: "text-violet-600"
      }
    ],
    [accounts]
  );

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
      await requestJson(url, body, method);
      setMessage(success);
      startRefresh(() => router.refresh());
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reach the server. Please try again.");
      return false;
    } finally {
      setPending("");
    }
  }

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const ok = await submitJson(
      "/api/admin/accounts",
      {
        name: form.get("name"),
        category: form.get("category") || null,
        sharedByLabel: form.get("sharedByLabel") || "system",
        totpSecret: form.get("totpSecret"),
        initialViewsForExistingUsers: form.get("initialViewsForExistingUsers"),
        isActive: true
      },
      "Account created."
    );

    if (ok) {
      formElement.reset();
      setShowCreateForm(false);
    }
  }

  async function updateAccount(event: FormEvent<HTMLFormElement>, accountId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ok = await submitJson(
      `/api/admin/accounts/${accountId}`,
      {
        name: form.get("name"),
        category: form.get("category") || null,
        sharedByLabel: form.get("sharedByLabel") || null,
        totpSecret: form.get("totpSecret"),
        isActive: form.get("isActive") === "on"
      },
      "Account updated.",
      "PATCH"
    );

    if (ok) {
      setEditingAccountId(null);
    }
  }

  function toggleAccount(account: AccountRow) {
    void submitJson(
      `/api/admin/accounts/${account.id}`,
      {
        name: account.name,
        category: account.category,
        sharedByLabel: account.sharedByLabel,
        totpSecret: "",
        isActive: !account.isActive
      },
      account.isActive ? "Account inactivated." : "Account activated.",
      "PATCH"
    );
  }

  function deleteAccount(account: AccountRow) {
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
  }

  function copyWithFallback(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function copyAccountLabel(account: AccountRow) {
    const value = `${account.name} (${account.category ?? "Uncategorized"})`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else if (!copyWithFallback(value)) {
        throw new Error("Clipboard fallback failed");
      }
      setMessage("Account label copied.");
    } catch {
      if (copyWithFallback(value)) {
        setMessage("Account label copied.");
      } else {
        setError("Copy is unavailable in this browser context.");
      }
    }
  }

  function AccountStatus({ account }: { account: AccountRow }) {
    if (account.isActive) {
      return (
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={14} />
          Active
        </span>
      );
    }

    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 text-xs font-bold text-slate-500">
        <XCircle size={14} />
        Inactive
      </span>
    );
  }


  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <section key={stat.label} className="rounded-lg border border-line bg-white p-5 shadow-panel">
              <div className="flex items-center gap-4">
                <Icon size={22} className={stat.className} />
                <div>
                  <p className={cx("text-2xl font-bold", stat.className)}>{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search accounts..."
            className="h-11 w-full rounded-lg border border-transparent bg-field pl-11 pr-4 text-sm font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/15"
          />
        </div>
        <button className={buttonClass} onClick={() => { setError(""); setShowCreateForm(true); }}>
          <Plus size={18} />
          Add Account
        </button>
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

      {filteredAccounts.length === 0 ? (
        <section className="rounded-lg border border-dashed border-line bg-white px-5 py-12 text-center text-sm font-semibold text-slate-500">
          No accounts match the current search.
        </section>
      ) : (
        <div className="grid gap-4">
          {filteredAccounts.map((account) => (
            <section
              key={account.id}
              className="rounded-lg border border-line bg-white p-5 shadow-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <AccountAvatar name={account.name} size="lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-bold text-ink">{account.name}</h2>
                      <AccountStatus account={account} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                      {account.category ? <CategoryBadge category={account.category} /> : null}
                      <span>by @{account.sharedByLabel ?? "system"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink"
                    onClick={() =>
                      setEditingAccountId((current) =>
                        current === account.id ? null : account.id
                      )
                    }
                    title="Edit account"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => deleteAccount(account)}
                    title="Delete account"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">Created</p>
                  <p className="mt-1 text-base font-bold text-ink">{account.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Default Quota</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-ink">
                    <InfinityIcon size={17} />
                    Unlimited
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Shared With</p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {account._count.otpAccesses} users
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">Total Views</p>
                  <p className="mt-1 text-base font-bold text-ink">
                    {(account._count.auditLogs ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-lg bg-field px-4 py-3 text-sm font-semibold text-slate-500">
                <KeyRound size={20} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">Encrypted TOTP secret stored</span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-ink"
                  onClick={() => copyAccountLabel(account)}
                  title="Copy account label"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className={secondaryButtonClass}
                  onClick={() => toggleAccount(account)}
                  disabled={pending !== "" || refreshing}
                >
                  {account.isActive ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                  {account.isActive ? "Inactivate" : "Activate"}
                </button>
                <button
                  className={dangerButtonClass}
                  onClick={() => deleteAccount(account)}
                  disabled={pending !== "" || refreshing}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>

              {editingAccountId === account.id ? <AccountEditForm account={account} pending={pending !== "" || refreshing} onSubmit={(event) => updateAccount(event, account.id)} /> : null}
            </section>
          ))}
        </div>
      )}

      {showCreateForm ? <CreateAccountModal pending={pending !== "" || refreshing} error={error} onSubmit={createAccount} onClose={() => setShowCreateForm(false)} /> : null}
    </div>
  );
}
