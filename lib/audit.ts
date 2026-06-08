import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AuditAction } from "@/lib/audit-actions";
import type { RequestMetadata } from "@/lib/http";

type AuditInput = {
  userId?: string;
  adminId?: string;
  accountId?: string;
  action: AuditAction | string;
  metadata?: Prisma.InputJsonValue;
} & RequestMetadata;

type AuditClient = Pick<PrismaClient, "auditLog">;

export async function createAuditLog(input: AuditInput, db: AuditClient = prisma) {
  await db.auditLog.create({
    data: {
      userId: input.userId,
      adminId: input.adminId,
      accountId: input.accountId,
      action: input.action,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata ?? {}
    }
  });
}
