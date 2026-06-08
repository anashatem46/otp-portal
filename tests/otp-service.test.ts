import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { consumeOtpView } from "@/lib/otp-service";
import { encryptSecret } from "@/lib/secret-crypto";

function createTx(access: unknown) {
  return {
    otpAccess: {
      findUnique: vi.fn().mockResolvedValue(access),
      update: vi.fn().mockResolvedValue({})
    },
    sharedAccount: {
      findFirst: vi.fn().mockResolvedValue(null)
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({})
    }
  };
}

describe("otp view consumption", () => {
  it("decrements remaining views and audits a successful view", async () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    const tx = createTx({
      id: "access-1",
      remainingViews: 1,
      account: {
        id: "account-1",
        isActive: true,
        ...encrypted
      }
    }) as any;

    const result = await consumeOtpView(
      {
        userId: "user-1",
        accountId: "account-1",
        metadata: {
          ipAddress: "127.0.0.1",
          userAgent: "vitest"
        }
      },
      tx
    );

    expect(result.otp).toMatch(/^\d{6}$/);
    expect(tx.otpAccess.update).toHaveBeenCalledWith({
      where: {
        id: "access-1"
      },
      data: {
        remainingViews: {
          decrement: 1
        }
      }
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_VIEWED,
          userId: "user-1",
          accountId: "account-1"
        })
      })
    );
  });

  it("blocks and audits users with no remaining views", async () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    const tx = createTx({
      id: "access-1",
      remainingViews: 0,
      account: {
        id: "account-1",
        isActive: true,
        ...encrypted
      }
    }) as any;

    await expect(
      consumeOtpView(
        {
          userId: "user-1",
          accountId: "account-1",
          metadata: {}
        },
        tx
      )
    ).rejects.toMatchObject({
      code: "OTP_BLOCKED"
    });

    expect(tx.otpAccess.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_BLOCKED
        })
      })
    );
  });

  it("allows unlimited admin views without decrementing access", async () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    const tx = createTx(null) as any;
    tx.sharedAccount.findFirst.mockResolvedValue({
      id: "account-1",
      name: "Admin Account",
      isActive: true,
      ...encrypted
    });

    const result = await consumeOtpView(
      {
        userId: "admin-1",
        accountId: "account-1",
        metadata: {},
        unlimited: true
      },
      tx
    );

    expect(result.otp).toMatch(/^\d{6}$/);
    expect(tx.otpAccess.findUnique).not.toHaveBeenCalled();
    expect(tx.otpAccess.update).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_VIEWED,
          metadata: {
            unlimited: true
          }
        })
      })
    );
  });
});
