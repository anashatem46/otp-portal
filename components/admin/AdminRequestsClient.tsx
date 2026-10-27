"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Plus,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { buttonClass, cx, secondaryButtonClass } from "@/components/ui";

type RequestRow = {
  id: string;
  requestedViews: number;
  currentViews: number | null;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt: string | null;
  user: {
    username: string;
    email: string;
  };
  account: {
    name: string;
  };
  reviewer: {
    username: string;
  } | null;
};

export function AdminRequestsClient({ requests }: { requests: RequestRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");

  const stats = useMemo(
    () => [
      {
        label: "Pending",
        value: requests.filter((request) => request.status === "PENDING").length,
        className: "text-amber-600"
      },
      {
        label: "Approved",
        value: requests.filter((request) => request.status === "APPROVED").length,
        className: "text-emerald-600"
      },
      {
        label: "Rejected",
        value: requests.filter((request) => request.status === "REJECTED").length,
        className: "text-red-600"
      }
    ],
    [requests]
  );

  async function review(requestId: string, action: "approve" | "reject") {
    setPending(`${requestId}:${action}`);
    setError("");

    const response = await fetch(`/api/admin/requests/${requestId}/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: action === "reject" ? JSON.stringify({ note: "" }) : undefined
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to review request.");
      setPending("");
      return;
    }

    setPending("");
    router.refresh();
  }

  function StatusPill({ status }: { status: RequestRow["status"] }) {
    if (status === "APPROVED") {
      return (
        <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={16} />
          Approved
        </span>
      );
    }

    if (status === "REJECTED") {
      return (
        <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-bold text-red-700">
          <XCircle size={16} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-amber-50 px-3 text-sm font-bold text-amber-600">
        <Clock3 size={16} />
        Pending
      </span>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <section
            key={stat.label}
            className="rounded-lg border border-line bg-white p-5 shadow-panel"
          >
            <p className={cx("text-2xl font-bold", stat.className)}>{stat.value}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{stat.label}</p>
          </section>
        ))}
      </div>

      <button
        type="button"
        className="flex h-14 items-center justify-center gap-3 rounded-lg border border-dashed border-line text-base font-bold text-slate-500 transition hover:border-moss/40 hover:text-moss"
      >
        <Plus size={20} />
        Request Additional Access
      </button>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      {requests.length === 0 ? (
        <section className="rounded-lg border border-line bg-white px-5 py-10 text-center text-sm font-semibold text-slate-500 shadow-panel">
          No requests found.
        </section>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <section
              key={request.id}
              className="rounded-lg border border-line bg-white p-5 shadow-panel"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-ink">Quota Increase</h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold lowercase text-slate-500">
                      {request.account.name}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Requested by @{request.user.username} · {request.createdAt}
                  </p>
                </div>
                <StatusPill status={request.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-base font-semibold text-slate-500">
                <span>
                  Current:{" "}
                  <strong className="font-bold text-ink">
                    {request.currentViews ?? 0}
                  </strong>
                </span>
                <ArrowRight size={20} />
                <span>
                  Requested:{" "}
                  <strong className="font-bold text-moss">
                    {request.requestedViews}
                  </strong>
                </span>
              </div>

              <p className="mt-4 flex items-start gap-3 text-base font-semibold text-slate-500">
                <MessageSquare size={20} className="mt-0.5 shrink-0" />
                <span>{request.reason}</span>
              </p>

              <div className="mt-5 border-t border-line pt-5">
                {request.status === "PENDING" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                      className={buttonClass}
                      onClick={() => review(request.id, "approve")}
                      disabled={pending !== ""}
                      title="Approve request"
                    >
                      <CheckCircle2 size={18} />
                      Approve
                    </button>
                    <button
                      className={secondaryButtonClass}
                      onClick={() => review(request.id, "reject")}
                      disabled={pending !== ""}
                      title="Reject request"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    Reviewed by @{request.reviewer?.username ?? "system"}
                    {request.reviewedAt ? ` · ${request.reviewedAt}` : ""}
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
