import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { generateOtp } from "@/lib/otp";
import { consumeOtpView } from "@/lib/otp-service";
import { encryptSecret } from "@/lib/secret-crypto";

vi.mock("@/lib/otp", () => ({
  generateOtp: vi.fn(() => ({
    otp: "123456",
    expiresIn: 30
  }))
}));

const mockedGenerateOtp = vi.mocked(generateOtp);

function createTx(access: unknown, updateCount = 1) {
  return {
    otpAccess: {
      findUnique: vi.fn().mockResolvedValue(access),
      updateMany: vi.fn().mockResolvedValue({
        count: updateCount
      })
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
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGenerateOtp.mockReturnValue({
      otp: "123456",
      expiresIn: 30
    });
  });

  it("atomically decrements remaining views and audits a successful view", async () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    const tx = createTx({
      id: "access-1",
      remainingViews: 2,
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

    expect(result).toEqual({
      otp: "123456",
      expiresIn: 30
    });
    expect(tx.otpAccess.updateMany).toHaveBeenCalledWith({
      where: {
        id: "access-1",
        remainingViews: {
          gt: 0
        }
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
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadata: {
            remainingViewsAfter: 1
          }
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

    expect(tx.otpAccess.updateMany).not.toHaveBeenCalled();
    expect(mockedGenerateOtp).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_BLOCKED,
          metadata: {
            reason: "NO_REMAINING_VIEWS"
          }
        })
      })
    );
  });

  it("blocks if a concurrent request consumes the last remaining view", async () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");
    const tx = createTx(
      {
        id: "access-1",
        remainingViews: 1,
        account: {
          id: "account-1",
          isActive: true,
          ...encrypted
        }
      },
      0
    ) as any;

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

    expect(tx.otpAccess.updateMany).toHaveBeenCalledWith({
      where: {
        id: "access-1",
        remainingViews: {
          gt: 0
        }
      },
      data: {
        remainingViews: {
          decrement: 1
        }
      }
    });
    expect(mockedGenerateOtp).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_BLOCKED,
          metadata: {
            reason: "QUOTA_CONSUMED_CONCURRENTLY"
          }
        })
      })
    );
  });

  it("allows unlimited admin views without decrementing access", async () => {
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

    expect(result).toEqual({
      otp: "123456",
      expiresIn: 30
    });
    expect(tx.otpAccess.findUnique).not.toHaveBeenCalled();
    expect(tx.otpAccess.updateMany).not.toHaveBeenCalled();
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

  it("blocks unlimited admin views for missing or inactive accounts", async () => {
    const tx = createTx(null) as any;

    await expect(
      consumeOtpView(
        {
          userId: "admin-1",
          accountId: "account-1",
          metadata: {},
          unlimited: true
        },
        tx
      )
    ).rejects.toMatchObject({
      code: "ACCOUNT_NOT_FOUND",
      status: 404
    });

    expect(tx.otpAccess.findUnique).not.toHaveBeenCalled();
    expect(tx.otpAccess.updateMany).not.toHaveBeenCalled();
    expect(mockedGenerateOtp).not.toHaveBeenCalled();
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: AUDIT_ACTIONS.OTP_BLOCKED,
          metadata: {
            reason: "ACCOUNT_NOT_FOUND_OR_INACTIVE",
            unlimited: true
          }
        })
      })
    );
  });
});
