"use client";

import { Eye, PlusCircle, Search, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AccountAvatar,
  CategoryBadge,
  buttonClass,
  cx,
  inputClass,
  secondaryButtonClass,
  textareaClass
} from "@/components/ui";

type AccountAccess = {
  id: string;
  name: string;
  category?: string;
  sharedByLabel?: string;
  remainingViews: number;
  isUnlimited?: boolean;
};

type OtpState = {
  otp: string;
  expiresIn: number;
};

export function DashboardClient({ accounts }: { accounts: AccountAccess[] }) {
  const [access, setAccess] = useState(accounts);
  const [otpByAccount, setOtpByAccount] = useState<Record<string, OtpState>>({});
  const [pendingAccount, setPendingAccount] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setOtpByAccount((current) => {
        const next: Record<string, OtpState> = {};

        Object.entries(current).forEach(([accountId, otp]) => {
          if (otp.expiresIn > 1) {
            next[accountId] = {
              ...otp,
              expiresIn: otp.expiresIn - 1
            };
          }
        });

        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!filter.trim()) return access;
    const q = filter.toLowerCase();
    return access.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.sharedByLabel?.toLowerCase().includes(q)
    );
  }, [access, filter]);

  async function viewOtp(accountId: string) {
    setMessage("");
    setPendingAccount(accountId);

    const response = await fetch(`/api/otp/${accountId}/view`, {
      method: "POST"
    });
    const data = await response.json();

    if (response.status === 202 && data.retryAfter) {
      setMessage("Waiting for the next OTP window.");
      window.setTimeout(() => {
        void viewOtp(accountId);
      }, Number(data.retryAfter) * 1000);
      return;
    }

    if (!response.ok) {
      setMessage(data.error ?? "Unable to view OTP.");
      setPendingAccount("");
      return;
    }

    setOtpByAccount((current) => ({
      ...current,
      [accountId]: data
    }));
    setAccess((current) =>
      current.map((account) =>
        account.id === accountId
          ? {
              ...account,
              remainingViews: account.isUnlimited
                ? account.remainingViews
                : Math.max(0, account.remainingViews - 1)
            }
          : account
      )
    );
    setPendingAccount("");
  }

  async function requestMore(event: FormEvent<HTMLFormElement>, accountId: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setMessage("");
    setPendingAccount(accountId);

    const form = new FormData(formElement);
    const response = await fetch(`/api/otp/${accountId}/request-more`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestedViews: form.get("requestedViews"),
        reason: form.get("reason")
      })
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to submit request.");
      setPendingAccount("");
      return;
    }

    formElement.reset();
    setMessage("Request submitted.");
    setPendingAccount("");
    setExpandedRequest(null);
  }

  return (
    <div className="grid gap-5">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            View shared account codes and request more access.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter accounts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
          />
        </div>
      </div>

      {/* Status message */}
      {message ? (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {message}
        </div>
      ) : null}

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-slate-500">
          {access.length === 0
            ? "No shared accounts are active."
            : "No accounts match your filter."}
        </div>
      ) : (
        /* Account cards grid */
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((account) => {
            const otp = otpByAccount[account.id];
            const blocked = !account.isUnlimited && account.remainingViews <= 0;
            const showRequestForm = expandedRequest === account.id;

            return (
              <section
                key={account.id}
                className="rounded-lg border border-line bg-white shadow-panel transition hover:shadow-md"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <AccountAvatar name={account.name} />
                    <div>
                      <h2 className="text-sm font-semibold text-ink">{account.name}</h2>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                        {account.category ? (
                          <CategoryBadge category={account.category} />
                        ) : null}
                        {account.sharedByLabel ? (
                          <span>shared by {account.sharedByLabel}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={cx(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white transition",
                      blocked
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-moss hover:bg-moss/90"
                    )}
                    onClick={() => viewOtp(account.id)}
                    disabled={blocked || pendingAccount === account.id}
                    title="View OTP"
                  >
                    <Eye size={14} />
                    View OTP
                  </button>
                </div>

                {/* OTP display area */}
                <div className="px-4 py-4">
                  <div
                    className={cx(
                      "grid min-h-[64px] place-items-center rounded-lg border px-4 py-3",
                      otp
                        ? "border-moss/20 bg-moss/5"
                        : "border-dashed border-line bg-field/50"
                    )}
                  >
                    {otp ? (
                      <div className="text-center">
                        <code className="text-3xl font-bold tracking-widest text-ink">
                          {otp.otp}
                        </code>
                        <p className="mt-1 text-xs text-slate-500">
                          Expires in {otp.expiresIn}s
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        {blocked ? "No views available" : "OTP Hidden"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card footer — remaining views + request more */}
                <div className="border-t border-line px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Remaining views</span>
                    <span className={cx(
                      "text-xs font-semibold",
                      account.isUnlimited
                        ? "text-moss"
                        : account.remainingViews <= 0
                          ? "text-red-500"
                          : "text-ink"
                    )}>
                      {account.isUnlimited ? "Unlimited" : account.remainingViews}
                    </span>
                  </div>
                </div>

                {/* Request more — collapsible */}
                {account.isUnlimited ? null : (
                  <>
                    {!showRequestForm ? (
                      <div className="border-t border-line px-4 py-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-moss hover:underline"
                          onClick={() => setExpandedRequest(account.id)}
                        >
                          <PlusCircle size={13} />
                          Request more access
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-line p-4">
                        <form
                          className="grid gap-3 sm:grid-cols-[100px_1fr_auto]"
                          onSubmit={(event) => requestMore(event, account.id)}
                        >
                          <label className="grid gap-1 text-xs font-medium text-slate-600">
                            Views
                            <input
                              className={inputClass}
                              name="requestedViews"
                              type="number"
                              min={1}
                              max={100}
                              defaultValue={1}
                              required
                            />
                          </label>
                          <label className="grid gap-1 text-xs font-medium text-slate-600">
                            Reason
                            <textarea
                              className={textareaClass}
                              name="reason"
                              required
                              minLength={5}
                            />
                          </label>
                          <div className="flex items-end gap-2">
                            <button
                              type="submit"
                              className={secondaryButtonClass}
                              disabled={pendingAccount === account.id}
                              title="Submit request"
                            >
                              <Send size={14} />
                              Submit
                            </button>
                            <button
                              type="button"
                              className="h-9 px-3 text-xs text-slate-400 hover:text-ink"
                              onClick={() => setExpandedRequest(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
