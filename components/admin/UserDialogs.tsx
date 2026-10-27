"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, ShieldCheck, UserPlus, X } from "lucide-react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Modal, FormError } from "@/components/Modal";
import { buttonClass, cx, inputClass, secondaryButtonClass } from "@/components/ui";
import { TEMPORARY_PASSWORD_MIN_LENGTH } from "@/lib/password-policy";
import type { Account, UserRow } from "@/components/admin/AdminUsersClient";

type DialogProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onClose: () => void;
  pending: boolean;
  error: string;
};

export function CreateUserModal({ accounts, onSubmit, onClose, pending, error }: DialogProps & { accounts: Account[] }) {
  const [createRole, setCreateRole] = useState<"ADMIN" | "USER">("USER");
  const roleOptions = [
    {
      value: "ADMIN" as const,
      label: "Admin",
      icon: ShieldCheck
    },
    {
      value: "USER" as const,
      label: "User",
      icon: UserPlus
    }
  ];

  return (
    <Modal titleId="create-user-title" onClose={onClose} busy={pending}>
      <form
        className="w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onSubmit={onSubmit}
      >
        <fieldset disabled={pending} className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-line px-7 py-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf4ef] text-moss">
                <UserPlus size={24} />
              </span>
              <div>
                <h2 id="create-user-title" className="text-2xl font-bold text-ink">
                  Create User
                </h2>
                <p className="mt-1 text-base font-semibold text-slate-500">
                  Set credentials and permissions
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink"
              onClick={() => onClose()}
              title="Close create user"
            >
              <X size={24} />
            </button>
          </div>

          <FormError error={error} />
          <div className="grid max-h-[calc(100vh-220px)] gap-6 overflow-y-auto px-7 py-6">
            <label className="grid gap-3 text-lg font-bold text-ink">
              Full name
              <input
                className="h-14 rounded-xl border border-line bg-field px-5 text-lg font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/15"
                name="name"
                placeholder="e.g. Sara Mansour"
              />
            </label>

            <label className="grid gap-3 text-lg font-bold text-ink">
              <span className="flex items-center justify-between gap-4">
                Username
                <span className="text-base font-semibold text-slate-500">
                  Used to log in - no spaces
                </span>
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
                  @
                </span>
                <input
                  className="h-14 w-full rounded-xl border border-line bg-field pl-10 pr-5 text-lg font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/15"
                  name="username"
                  placeholder="sara_m"
                  required
                />
              </span>
            </label>

            <label className="grid gap-3 text-lg font-bold text-ink">
              Email address
              <input
                className="h-14 rounded-xl border border-line bg-field px-5 text-lg font-semibold text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:bg-white focus:ring-2 focus:ring-moss/15"
                name="email"
                type="email"
                placeholder="sara@company.io"
              />
            </label>

            <label className="grid gap-3 text-lg font-bold text-ink">
              Password
              <PasswordInput
                className="h-14 rounded-xl bg-field px-5 text-lg font-semibold placeholder:text-slate-500"
                name="temporaryPassword"
                minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
                placeholder={`Min. ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
                required
              />
            </label>

            <div className="grid gap-3">
              <span className="text-lg font-bold text-ink">Role</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = createRole === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cx(
                        "grid min-h-[76px] place-items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition",
                        selected
                          ? "border-moss bg-[#eaf4ef] text-moss"
                          : "border-line bg-field text-slate-500 hover:border-moss/40 hover:bg-white"
                      )}
                      aria-pressed={selected}
                      onClick={() => setCreateRole(option.value)}
                    >
                      <Icon size={24} />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-base font-semibold text-slate-500">
                {createRole === "ADMIN" ? "Can manage users, accounts, and requests. Unlimited OTP views on all active accounts." : "Can view OTPs on granted accounts and submit access requests."}
              </p>
            </div>

            <input type="hidden" name="role" value={createRole} />
              <fieldset className={createRole === "ADMIN" ? "hidden" : "grid gap-3"} hidden={createRole === "ADMIN"} disabled={createRole === "ADMIN"}>
                <legend className="text-lg font-bold text-ink">Account access</legend>
                <p className="text-sm text-slate-500">Choose accounts to grant access. No accounts are selected by default.</p>
                {accounts.length === 0 ? <p>No active accounts available.</p> : accounts.map((account) => (
                  <label key={account.id} className="flex items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" name="accountId" value={account.id} />
                    {account.name}
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-bold">
                  Initial views per selected account
                  <input className={inputClass} type="number" name="viewLimit" min={0} max={1000} defaultValue={20} required />
                </label>
                <p className="text-sm text-slate-500">These finite quotas apply to selected existing accounts. Newly added accounts use their own initial quota.</p>
              </fieldset>
          </div>

          <div className="grid gap-3 px-7 pb-7 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex h-14 items-center justify-center rounded-xl border border-line bg-white px-5 text-lg font-bold text-slate-500 transition hover:bg-field hover:text-ink"
              onClick={() => onClose()}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-14 items-center justify-center rounded-xl bg-moss px-5 text-lg font-bold text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
            >
              Create user
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}


export function ResetPasswordModal({ user, onSubmit, onClose, pending, error }: DialogProps & { user: UserRow }) {
  return (
    <Modal titleId="reset-password-title" onClose={onClose} busy={pending}>
      <form
        className="w-full max-w-[480px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onSubmit={onSubmit}
      >
        <fieldset disabled={pending} className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-line px-7 py-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf4ef] text-moss">
                <KeyRound size={24} />
              </span>
              <div>
                <h2 id="reset-password-title" className="text-2xl font-bold text-ink">
                  Reset password
                </h2>
                <p className="mt-1 text-base font-semibold text-slate-500">
                  Set a new password for @{user.username}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink"
              onClick={() => onClose()}
              title="Close reset password"
            >
              <X size={24} />
            </button>
          </div>

          <FormError error={error} />
          <div className="grid gap-3 px-7 py-6">
            <label className="grid gap-3 text-lg font-bold text-ink">
              New password
              <PasswordInput
                className="h-14 rounded-xl bg-field px-5 text-lg font-semibold placeholder:text-slate-500"
                name="temporaryPassword"
                minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
                placeholder={`Min. ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
                required
              />
            </label>
            <p className="text-sm font-semibold text-slate-500">
              Existing sessions will be signed out. Share the new password securely with the user.
            </p>
          </div>

          <div className="grid gap-3 px-7 pb-7 sm:grid-cols-2">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-white px-5 text-base font-bold text-slate-500 transition hover:bg-field hover:text-ink"
              onClick={() => onClose()}
            >
              Cancel
            </button>
            <button
              className="inline-flex h-12 items-center justify-center rounded-xl bg-moss px-5 text-base font-bold text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={pending}
            >
              Reset password
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}


export function AdjustViewsModal({ user, accounts, onSubmit, onClose, pending, error }: DialogProps & { user: UserRow; accounts: Account[] }) {
  return (
    <Modal titleId="adjust-views-title" onClose={onClose} busy={pending}>
      <form className="grid w-full max-w-lg gap-5 rounded-xl bg-white p-6 shadow-panel" onSubmit={onSubmit}>
        <h2 id="adjust-views-title" className="text-xl font-bold">Adjust views for @{user.username}</h2>
        <FormError error={error} />
        <fieldset disabled={pending} className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Account
            <select className={inputClass} name="accountId" required>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ({user.otpAccesses.find((access) => access.account.id === account.id)?.remainingViews ?? 0} remaining)</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            View adjustment
            <input className={inputClass} name="deltaViews" type="number" min={-1000} max={1000} defaultValue={1} required />
          </label>
          <p className="text-sm text-slate-500">Use a positive number to grant views or a negative number to remove views. Zero is not an adjustment.</p>
          <div className="flex justify-end gap-3">
            <button type="button" className={secondaryButtonClass} onClick={onClose}>Cancel</button>
            <button className={buttonClass} disabled={accounts.length === 0}>Apply adjustment</button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
