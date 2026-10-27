import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { RequestMetadata } from "@/lib/http";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { decryptSecret } from "@/lib/secret-crypto";
import { generateOtp } from "@/lib/otp";

type TransactionClient = Prisma.TransactionClient;

const encryptedAccountSelect = {
  id: true,
  encryptedSecret: true,
  iv: true,
  authTag: true
} satisfies Prisma.SharedAccountSelect;

const accessForOtpSelect = {
  id: true,
  remainingViews: true,
  account: {
    select: {
      ...encryptedAccountSelect,
      isActive: true
    }
  }
} satisfies Prisma.OtpAccessSelect;

type EncryptedAccount = Prisma.SharedAccountGetPayload<{
  select: typeof encryptedAccountSelect;
}>;

type OtpAccessForView = Prisma.OtpAccessGetPayload<{
  select: typeof accessForOtpSelect;
}>;

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
    return consumeUnlimitedOtpView(input, tx);
  }

  return consumeLimitedOtpView(input, tx);
}

async function consumeUnlimitedOtpView(
  input: ViewOtpInput,
  tx: TransactionClient
) {
  const account = await findActiveAccount(input.accountId, tx);

  if (!account) {
    await auditOtpBlocked(input, tx, {
      reason: "ACCOUNT_NOT_FOUND_OR_INACTIVE",
      unlimited: true
    });

    throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  const result = generateOtpForAccount(account);

  await auditOtpViewed(input, tx, {
    unlimited: true
  });

  return result;
}

async function consumeLimitedOtpView(
  input: ViewOtpInput,
  tx: TransactionClient
) {
  const access = await requireLimitedAccessCanView(
    await tx.otpAccess.findUnique({
      where: {
        userId_accountId: {
          userId: input.userId,
          accountId: input.accountId
        }
      },
      select: accessForOtpSelect
    }),
    input,
    tx
  );

  const updateResult = await tx.otpAccess.updateMany({
    where: {
      id: access.id,
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

  if (updateResult.count !== 1) {
    return blockLimitedOtpView(input, tx, "QUOTA_CONSUMED_CONCURRENTLY");
  }

  const result = generateOtpForAccount(access.account);

  await auditOtpViewed(input, tx, {
    remainingViewsAfter: access.remainingViews - 1
  });

  return result;
}

function generateOtpForAccount(account: EncryptedAccount) {
  const secret = decryptSecret({
    encryptedSecret: account.encryptedSecret,
    iv: account.iv,
    authTag: account.authTag
  });

  return generateOtp(secret);
}

async function findActiveAccount(accountId: string, tx: TransactionClient) {
  return tx.sharedAccount.findFirst({
    where: {
      id: accountId,
      isActive: true
    },
    select: encryptedAccountSelect
  });
}

async function requireLimitedAccessCanView(
  access: OtpAccessForView | null,
  input: ViewOtpInput,
  tx: TransactionClient
): Promise<OtpAccessForView> {
  if (!access) {
    return blockLimitedOtpView(input, tx, "NO_ACCESS_RECORD");
  }

  if (!access.account.isActive) {
    return blockLimitedOtpView(input, tx, "ACCOUNT_INACTIVE");
  }

  if (access.remainingViews <= 0) {
    return blockLimitedOtpView(input, tx, "NO_REMAINING_VIEWS");
  }

  return access;
}

async function blockLimitedOtpView(
  input: ViewOtpInput,
  tx: TransactionClient,
  reason: string
): Promise<never> {
  await auditOtpBlocked(input, tx, {
    reason
  });

  throw new AppError(
    "No OTP views are available. Request more access.",
    403,
    "OTP_BLOCKED"
  );
}

async function auditOtpViewed(
  input: ViewOtpInput,
  tx: TransactionClient,
  metadata: Prisma.InputJsonValue
) {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      action: AUDIT_ACTIONS.OTP_VIEWED,
      ipAddress: input.metadata.ipAddress,
      userAgent: input.metadata.userAgent,
      metadata
    }
  });
}

async function auditOtpBlocked(
  input: ViewOtpInput,
  tx: TransactionClient,
  metadata: Prisma.InputJsonValue
) {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      accountId: input.accountId,
      action: AUDIT_ACTIONS.OTP_BLOCKED,
      ipAddress: input.metadata.ipAddress,
      userAgent: input.metadata.userAgent,
      metadata
    }
  });
}
