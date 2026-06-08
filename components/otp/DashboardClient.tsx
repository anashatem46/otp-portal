"use client";

import { Eye, PlusCircle, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  buttonClass,
  cx,
  inputClass,
  secondaryButtonClass,
  textareaClass
} from "@/components/ui";

type AccountAccess = {
  id: string;
  name: string;
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

  const hasAccounts = useMemo(() => access.length > 0, [access.length]);

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
  }

  if (!hasAccounts) {
    return (
      <div className="rounded border border-line bg-white p-6 text-sm text-slate-600">
        No shared accounts are active.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <div className="rounded border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          {message}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {access.map((account) => {
          const otp = otpByAccount[account.id];
          const blocked = !account.isUnlimited && account.remainingViews <= 0;

          return (
            <section key={account.id} className="rounded border border-line bg-white p-4 shadow-panel">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{account.name}</h2>
                  <p className="text-sm text-slate-600">
                    Remaining views:{" "}
                    <span className="font-semibold text-ink">
                      {account.isUnlimited ? "Unlimited" : account.remainingViews}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => viewOtp(account.id)}
                  disabled={blocked || pendingAccount === account.id}
                  title="View OTP"
                >
                  <Eye size={16} />
                  View OTP
                </button>
              </div>

              <div
                className={cx(
                  "mt-4 grid min-h-[84px] place-items-center rounded border px-4 py-3",
                  otp ? "border-moss/30 bg-field" : "border-dashed border-line bg-white"
                )}
              >
                {otp ? (
                  <div className="text-center">
                    <code className="text-4xl font-semibold tracking-normal text-ink">
                      {otp.otp}
                    </code>
                    <p className="mt-1 text-xs text-slate-500">
                      Expires in {otp.expiresIn}s
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    {blocked ? "No views available" : "OTP hidden"}
                  </p>
                )}
              </div>

              {account.isUnlimited ? null : (
                <form
                  className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr_auto]"
                  onSubmit={(event) => requestMore(event, account.id)}
                >
                  <label className="grid gap-1 text-xs font-medium text-slate-700">
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
                  <label className="grid gap-1 text-xs font-medium text-slate-700">
                    Reason
                    <textarea
                      className={textareaClass}
                      name="reason"
                      required
                      minLength={5}
                    />
                  </label>
                  <button
                    type="submit"
                    className={secondaryButtonClass}
                    disabled={pendingAccount === account.id}
                    title="Request more access"
                  >
                    {blocked ? <PlusCircle size={16} /> : <Send size={16} />}
                    Request
                  </button>
                </form>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
