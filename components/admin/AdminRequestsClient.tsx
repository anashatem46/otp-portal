"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClass, dangerButtonClass, EmptyState, StatusBadge } from "@/components/ui";

type RequestRow = {
  id: string;
  requestedViews: number;
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

  return (
    <section className="overflow-hidden rounded border border-line bg-white shadow-panel">
      {error ? <p className="border-b border-line px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {requests.length === 0 ? (
        <EmptyState>No requests found.</EmptyState>
      ) : (
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="bg-field text-xs uppercase text-slate-600">
          <tr>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Account</th>
            <th className="px-4 py-3">Views</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Reviewed by</th>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-t border-line align-top">
              <td className="px-4 py-3">
                <span className="block font-medium">{request.user.username}</span>
                <span className="block text-xs text-slate-500">{request.user.email}</span>
              </td>
              <td className="px-4 py-3">{request.account.name}</td>
              <td className="px-4 py-3">{request.requestedViews}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={
                    request.status === "APPROVED"
                      ? "green"
                      : request.status === "REJECTED"
                        ? "red"
                        : "yellow"
                  }
                >
                  {request.status.toLowerCase()}
                </StatusBadge>
              </td>
              <td className="max-w-sm px-4 py-3 text-slate-600">{request.reason}</td>
              <td className="px-4 py-3">{request.reviewer?.username ?? "none"}</td>
              <td className="px-4 py-3 text-slate-600">{request.createdAt}</td>
              <td className="px-4 py-3">
                {request.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      className={buttonClass}
                      onClick={() => review(request.id, "approve")}
                      disabled={pending !== ""}
                      title="Approve request"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      className={dangerButtonClass}
                      onClick={() => review(request.id, "reject")}
                      disabled={pending !== ""}
                      title="Reject request"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-slate-500">
                    {request.reviewedAt ?? "reviewed"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}
