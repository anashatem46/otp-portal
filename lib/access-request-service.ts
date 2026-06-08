import { AccessRequestStatus, type PrismaClient } from "@prisma/client";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { RequestMetadata } from "@/lib/http";

export async function submitAccessRequest(
  input: {
    userId: string;
    accountId: string;
    requestedViews: number;
    reason: string;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  const account = await db.sharedAccount.findFirst({
    where: {
      id: input.accountId,
      isActive: true
    },
    select: {
      id: true
    }
  });

  if (!account) {
    throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
  }

  return db.$transaction(async (tx) => {
    const request = await tx.accessRequest.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        requestedViews: input.requestedViews,
        reason: input.reason
      }
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        accountId: input.accountId,
        action: AUDIT_ACTIONS.ACCESS_REQUEST_SUBMITTED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          requestId: request.id,
          requestedViews: input.requestedViews
        }
      }
    });

    return request;
  });
}

export async function reviewAccessRequest(
  input: {
    adminId: string;
    requestId: string;
    approve: boolean;
    note?: string;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  return db.$transaction(async (tx) => {
    const request = await tx.accessRequest.findUnique({
      where: {
        id: input.requestId
      }
    });

    if (!request) {
      throw new AppError("Access request not found", 404, "REQUEST_NOT_FOUND");
    }

    if (request.status !== AccessRequestStatus.PENDING) {
      throw new AppError("Access request has already been reviewed", 409, "REQUEST_REVIEWED");
    }

    const status = input.approve
      ? AccessRequestStatus.APPROVED
      : AccessRequestStatus.REJECTED;

    const updatedRequest = await tx.accessRequest.update({
      where: {
        id: request.id
      },
      data: {
        status,
        reviewedBy: input.adminId,
        reviewedAt: new Date()
      }
    });

    if (input.approve) {
      await tx.otpAccess.upsert({
        where: {
          userId_accountId: {
            userId: request.userId,
            accountId: request.accountId
          }
        },
        create: {
          userId: request.userId,
          accountId: request.accountId,
          remainingViews: request.requestedViews
        },
        update: {
          remainingViews: {
            increment: request.requestedViews
          }
        }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: request.userId,
        adminId: input.adminId,
        accountId: request.accountId,
        action: input.approve
          ? AUDIT_ACTIONS.REQUEST_APPROVED
          : AUDIT_ACTIONS.REQUEST_REJECTED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          requestId: request.id,
          requestedViews: request.requestedViews,
          note: input.note ?? ""
        }
      }
    });

    return updatedRequest;
  });
}
