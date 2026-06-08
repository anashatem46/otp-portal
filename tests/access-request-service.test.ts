import { AccessRequestStatus } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { reviewAccessRequest } from "@/lib/access-request-service";

describe("access request review", () => {
  it("approves pending requests and increments views", async () => {
    const request = {
      id: "request-1",
      userId: "user-1",
      accountId: "account-1",
      requestedViews: 2,
      status: AccessRequestStatus.PENDING
    };
    const tx = {
      accessRequest: {
        findUnique: vi.fn().mockResolvedValue(request),
        update: vi.fn().mockResolvedValue({
          ...request,
          status: AccessRequestStatus.APPROVED
        })
      },
      otpAccess: {
        upsert: vi.fn().mockResolvedValue({})
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      $transaction: vi.fn((callback) => callback(tx))
    } as any;

    await reviewAccessRequest(
      {
        adminId: "admin-1",
        requestId: "request-1",
        approve: true,
        metadata: {}
      },
      db
    );

    expect(tx.otpAccess.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          remainingViews: {
            increment: 2
          }
        }
      })
    );
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.REQUEST_APPROVED,
          adminId: "admin-1"
        })
      })
    );
  });

  it("rejects pending requests without changing views", async () => {
    const request = {
      id: "request-1",
      userId: "user-1",
      accountId: "account-1",
      requestedViews: 2,
      status: AccessRequestStatus.PENDING
    };
    const tx = {
      accessRequest: {
        findUnique: vi.fn().mockResolvedValue(request),
        update: vi.fn().mockResolvedValue({
          ...request,
          status: AccessRequestStatus.REJECTED
        })
      },
      otpAccess: {
        upsert: vi.fn().mockResolvedValue({})
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({})
      }
    };
    const db = {
      $transaction: vi.fn((callback) => callback(tx))
    } as any;

    await reviewAccessRequest(
      {
        adminId: "admin-1",
        requestId: "request-1",
        approve: false,
        note: "Not needed",
        metadata: {}
      },
      db
    );

    expect(tx.otpAccess.upsert).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.REQUEST_REJECTED,
          metadata: expect.objectContaining({
            note: "Not needed"
          })
        })
      })
    );
  });
});
