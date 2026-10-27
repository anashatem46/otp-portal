"use client";

import {
  Check,
  Copy,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  Search,
  Send
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { OtpCountdown } from "@/components/otp/OtpCountdown";
import {
  AccountAvatar,
  CategoryBadge,
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
  expiresAt: number;
};

export function DashboardClient({ accounts }: { accounts: AccountAccess[] }) {
  const [access, setAccess] = useState(accounts);
  const [otpByAccount, setOtpByAccount] = useState<Record<string, OtpState>>({});
  const [pendingAccount, setPendingAccount] = useState("");
  const [copiedAccount, setCopiedAccount] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

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

    if (!response.ok) {
      setMessage(data.error ?? "Unable to view OTP.");
      setPendingAccount("");
      return;
    }

    setOtpByAccount((current) => ({
      ...current,
      [accountId]: {
        otp: data.otp,
        expiresAt: Date.now() + data.expiresIn * 1000
      }
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

  function hideOtp(accountId: string) {
    setOtpByAccount((current) => {
      const next = { ...current };
      delete next[accountId];
      return next;
    });
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

  async function copyOtp(accountId: string) {
    const otp = otpByAccount[accountId];
    if (!otp) return;

    function showCopiedIcon() {
      setMessage("");
      setCopiedAccount(accountId);
      window.setTimeout(() => {
        setCopiedAccount((current) => (current === accountId ? "" : current));
      }, 1400);
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(otp.otp);
      } else if (!copyWithFallback(otp.otp)) {
        throw new Error("Clipboard fallback failed");
      }
      showCopiedIcon();
    } catch {
      if (copyWithFallback(otp.otp)) {
        showCopiedIcon();
      } else {
        setCopiedAccount("");
        setMessage("Unable to copy OTP.");
      }
    }
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
    <div className="mx-auto grid w-full max-w-[1000px] gap-6">
      <div className="grid gap-4 md:grid-cols-[1fr_246px] md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            View shared account codes and request more access.
          </p>
        </div>
        <div className="relative w-full">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Filter accounts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm font-medium text-ink outline-none transition placeholder:text-slate-500 focus:border-moss focus:ring-2 focus:ring-moss/15"
          />
        </div>
      </div>

      {message ? (
        <div className="w-fit max-w-full rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900">
          {message}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-white px-5 py-12 text-center text-base text-slate-500">
          {access.length === 0
            ? "No shared accounts are active."
            : "No accounts match your filter."}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((account) => {
            const otp = otpByAccount[account.id];
            const blocked = !account.isUnlimited && account.remainingViews <= 0;
            const showRequestForm = expandedRequest === account.id;
            const copied = copiedAccount === account.id;

            return (
              <section
                key={account.id}
                className="overflow-hidden rounded-lg border border-line bg-white shadow-[0_1px_4px_rgba(15,23,42,0.12)] transition hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <AccountAvatar name={account.name} />
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-ink">
                        {account.name}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                        {account.category ? (
                          <CategoryBadge category={account.category} />
                        ) : null}
                        {account.sharedByLabel ? (
                          <span>shared by {account.sharedByLabel}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {otp ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink"
                        onClick={() => viewOtp(account.id)}
                        disabled={pendingAccount === account.id}
                        title="Refresh OTP"
                      >
                        <RefreshCw size={17} />
                      </button>
                      <button
                        type="button"
                        className={cx(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-field hover:text-ink",
                          copied
                            ? "bg-[#eaf4ef] text-moss"
                            : "text-slate-500"
                        )}
                        onClick={() => copyOtp(account.id)}
                        title={copied ? "OTP copied" : "Copy OTP"}
                        aria-label={copied ? "OTP copied" : "Copy OTP"}
                      >
                        {copied ? <Check size={17} /> : <Copy size={17} />}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 select-none items-center justify-center gap-2 rounded-lg bg-moss px-4 text-sm font-bold text-white transition hover:bg-moss/90"
                        onClick={() => hideOtp(account.id)}
                        title="Hide OTP"
                      >
                        <EyeOff size={15} />
                        <span className="hidden sm:inline">Hide</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={cx(
                        "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition",
                        blocked
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-moss hover:bg-moss/90"
                      )}
                      onClick={() => viewOtp(account.id)}
                      disabled={blocked || pendingAccount === account.id}
                      title="View OTP"
                    >
                      <Eye size={14} />
                      <span className="hidden text-sm sm:inline">
                        {pendingAccount === account.id ? "Loading" : "View OTP"}
                      </span>
                    </button>
                  )}
                </div>

                <div className="mx-5 border-t border-line" />

                <div className={cx("grid place-items-center px-5", otp ? "min-h-[112px] py-4" : "min-h-[72px] py-5")}>
                  {otp ? (
                    <div className="w-full">
                      <div className="mx-auto grid w-full max-w-[320px] grid-cols-6 gap-2">
                        {otp.otp.replace(/\s/g, "").split("").map((digit, index) => (
                          <span
                            key={`${digit}-${index}`}
                            className="grid aspect-square min-w-0 place-items-center rounded-lg border border-emerald-200 bg-[#eaf4ef] font-mono text-2xl font-bold text-ink sm:text-3xl"
                          >
                            {digit}
                          </span>
                        ))}
                      </div>
                      <OtpCountdown
                        key={otp.expiresAt}
                        expiresAt={otp.expiresAt}
                        onExpire={() => hideOtp(account.id)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-slate-500">
                      {blocked ? "No views available" : "OTP hidden"}
                    </p>
                  )}
                </div>

                <div className="border-t border-line bg-[#fbfcfd] px-5 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-slate-500">
                      Remaining views
                    </span>
                    <span
                      className={cx(
                        "text-xs font-bold",
                        account.isUnlimited
                          ? "text-moss"
                          : account.remainingViews <= 0
                            ? "text-red-500"
                            : "text-ink"
                      )}
                    >
                      {account.isUnlimited ? "Unlimited" : account.remainingViews}
                    </span>
                  </div>
                </div>

                {account.isUnlimited ? null : (
                  <>
                    {!showRequestForm ? (
                      <div className="border-t border-line px-5 py-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-sm font-bold text-moss hover:underline"
                          onClick={() => setExpandedRequest(account.id)}
                        >
                          <PlusCircle size={16} />
                          Request more OTP
                        </button>
                      </div>
                    ) : null}
                    {showRequestForm ? (
                      <div className="border-t border-line p-5 sm:p-7">
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
                              className="h-11 px-3 text-sm font-semibold text-slate-400 hover:text-ink"
                              onClick={() => setExpandedRequest(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : null}
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
