import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { RequestMetadata } from "@/lib/http";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { decryptSecret } from "@/lib/secret-crypto";
import { generateOtp } from "@/lib/otp";

type TransactionClient = Prisma.TransactionClient;

type ViewOtpInput = {
  userId: string;
  accountId: string;
  metadata: RequestMetadata;
  unlimited?: boolean;
};

export async function viewOtpForUser(
  input: ViewOtpInput,
  db: PrismaClient = prisma
) {
  return db.$transaction(async (tx) => consumeOtpView(input, tx));
}

export async function consumeOtpView(
  input: ViewOtpInput,
  tx: TransactionClient
) {
  if (input.unlimited) {
    const account = await tx.sharedAccount.findFirst({
      where: {
        id: input.accountId,
        isActive: true
      }
    });

    if (!account) {
      await tx.auditLog.create({
        data: {
          userId: input.userId,
          accountId: input.accountId,
          action: AUDIT_ACTIONS.OTP_BLOCKED,
          ipAddress: input.metadata.ipAddress,
          userAgent: input.metadata.userAgent,
          metadata: {
            reason: "ACCOUNT_NOT_FOUND_OR_INACTIVE",
            unlimited: true
          }
        }
      });

      throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    const secret = decryptSecret({
      encryptedSecret: account.encryptedSecret,
      iv: account.iv,
      authTag: account.authTag
    });
    const result = generateOtp(secret);

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        action: AUDIT_ACTIONS.OTP_VIEWED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          unlimited: true
        }
      }
    });

    return result;
  }

  const access = await tx.otpAccess.findUnique({
    where: {
      userId_accountId: {
        userId: input.userId,
        accountId: input.accountId
      }
    },
    include: {
      account: true
    }
  });

  if (!access || !access.account.isActive || access.remainingViews <= 0) {
    await tx.auditLog.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        action: AUDIT_ACTIONS.OTP_BLOCKED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          reason: !access ? "NO_ACCESS_RECORD" : "NO_REMAINING_VIEWS"
        }
      }
    });

    throw new AppError(
      "No OTP views are available. Request more access.",
      403,
      "OTP_BLOCKED"
    );
  }

  await tx.otpAccess.update({
    where: {
      id: access.id
    },
    data: {
      remainingViews: {
        decrement: 1
      }
    }
  });

  const secret = decryptSecret({
    encryptedSecret: access.account.encryptedSecret,
    iv: access.account.iv,
    authTag: access.account.authTag
  });
  const result = generateOtp(secret);

  await tx.auditLog.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      action: AUDIT_ACTIONS.OTP_VIEWED,
      ipAddress: input.metadata.ipAddress,
      userAgent: input.metadata.userAgent,
      metadata: {
        remainingViewsAfter: access.remainingViews - 1
      }
    }
  });

  return result;
}
