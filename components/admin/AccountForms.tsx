"use client";

import type { FormEvent } from "react";
import { AlertCircle, Plus, Save, X } from "lucide-react";
import { Modal, FormError } from "@/components/Modal";
import { buttonClass, cx, inputClass, secondaryButtonClass } from "@/components/ui";
import type { AccountRow } from "@/components/admin/AdminAccountsClient";

const categoryOptions = ["AI", "Productivity", "Design", "Dev", "Finance", "Operations"];

export function CreateAccountModal({ onSubmit, onClose, pending, error }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>; onClose: () => void; pending: boolean; error: string }) {
  return (
    <Modal titleId="create-account-title" onClose={onClose} busy={pending}>
      <form
        className="w-full max-w-[720px] overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
        onSubmit={onSubmit}
      >
        <fieldset disabled={pending} className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              <h2 id="create-account-title" className="text-2xl font-bold text-ink">
                Add New Account
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Store an encrypted TOTP secret and initial quota.
              </p>
            </div>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink"
              onClick={() => onClose()}
              title="Close add account"
            >
              <X size={22} />
            </button>
          </div>

          <div className="grid gap-5 px-6 py-5">
            <FormError error={error} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-ink">
                Account Name
                <input
                  className={inputClass}
                  name="name"
                  placeholder="e.g. Slack"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-ink">
                Category
                <select className={inputClass} name="category" defaultValue="Productivity">
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-ink">
              TOTP Secret
              <input
                className={cx(inputClass, "font-mono tracking-wider")}
                name="totpSecret"
                placeholder="Enter the base32-encoded TOTP secret"
                required
              />
            </label>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <AlertCircle size={17} />
              This is the secret key from the 2FA setup. Keep it secure.
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-ink">
                Default Quota
                <input
                  className={inputClass}
                  name="initialViewsForExistingUsers"
                  type="number"
                  min={0}
                  max={1000}
                  defaultValue={100}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-ink">
                Shared by
                <input className={inputClass} name="sharedByLabel" placeholder="system" />
              </label>
            </div>
          </div>

          <div className="grid gap-3 px-6 pb-6 sm:grid-cols-2">
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => onClose()}
            >
              Cancel
            </button>
            <button className={buttonClass} disabled={pending}>
              <Plus size={16} />
              Add Account
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export function AccountEditForm({ account, pending, onSubmit }: { account: AccountRow; pending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void> }) {
  return (
    <form
      className="mt-4 grid gap-3 rounded-lg border border-line bg-[#fbfcfd] p-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      onSubmit={onSubmit}
    >
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        Name
        <input className={inputClass} name="name" defaultValue={account.name} required />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        Category
        <input className={inputClass} name="category" defaultValue={account.category ?? ""} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        Shared by
        <input
          className={inputClass}
          name="sharedByLabel"
          defaultValue={account.sharedByLabel ?? ""}
        />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-600">
        New TOTP secret
        <input className={inputClass} name="totpSecret" placeholder="Leave blank" />
      </label>
      <div className="flex items-end gap-2">
        <label className="flex h-11 items-center gap-2 text-sm font-bold text-slate-700">
          <input name="isActive" type="checkbox" defaultChecked={account.isActive} />
          Active
        </label>
        <button className={secondaryButtonClass} disabled={pending}>
          <Save size={16} />
          Save
        </button>
      </div>
    </form>
  );
}

