import { Role, type PrismaClient } from "@prisma/client";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { RequestMetadata } from "@/lib/http";
import { hashPassword } from "@/lib/password";
import { encryptSecret } from "@/lib/secret-crypto";

type InitialAccessInput = {
  accountId: string;
  remainingViews: number;
};

export async function createManagedUser(
  input: {
    adminId: string;
    name?: string;
    username: string;
    email: string;
    temporaryPassword: string;
    role: "USER" | "ADMIN";
    isActive: boolean;
    initialAccess: InitialAccessInput[];
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  const passwordHash = await hashPassword(input.temporaryPassword);

  return db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name || null,
        username: input.username.toLowerCase(),
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role === "ADMIN" ? Role.ADMIN : Role.USER,
        isActive: input.isActive,
        mustChangePassword: false
      }
    });

    if (input.initialAccess.length > 0) {
      await tx.otpAccess.createMany({
        data: input.initialAccess.map((access) => ({
          userId: user.id,
          accountId: access.accountId,
          remainingViews: access.remainingViews
        })),
        skipDuplicates: true
      });
    }

    await tx.auditLog.create({
      data: {
        userId: user.id,
        adminId: input.adminId,
        action: AUDIT_ACTIONS.USER_CREATED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          username: user.username,
          role: user.role,
          isActive: user.isActive
        }
      }
    });

    return user;
  });
}

export async function resetUserPassword(
  input: {
    adminId: string;
    userId: string;
    temporaryPassword: string;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  const passwordHash = await hashPassword(input.temporaryPassword);

  return db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: input.userId
      },
      data: {
        passwordHash,
        mustChangePassword: false
      }
    });

    await tx.session.deleteMany({
      where: {
        userId: input.userId
      }
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        adminId: input.adminId,
        action: AUDIT_ACTIONS.PASSWORD_RESET_BY_ADMIN,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {}
      }
    });

    return user;
  });
}

export async function setUserActiveStatus(
  input: {
    adminId: string;
    userId: string;
    isActive: boolean;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: input.userId
      },
      data: {
        isActive: input.isActive
      }
    });

    if (!input.isActive) {
      await tx.session.deleteMany({
        where: {
          userId: input.userId
        }
      });
    }

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        adminId: input.adminId,
        action: input.isActive
          ? AUDIT_ACTIONS.USER_ENABLED
          : AUDIT_ACTIONS.USER_DISABLED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {}
      }
    });

    return user;
  });
}

export async function deleteManagedUser(
  input: {
    adminId: string;
    userId: string;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  if (input.adminId === input.userId) {
    throw new AppError("You cannot delete your own admin account", 400, "SELF_DELETE_BLOCKED");
  }

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: {
        id: input.userId
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    await tx.user.delete({
      where: {
        id: input.userId
      }
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        action: AUDIT_ACTIONS.USER_DELETED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          deletedUserId: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

    return user;
  });
}

export async function adjustUserViews(
  input: {
    adminId: string;
    userId: string;
    accountId: string;
    deltaViews: number;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  return db.$transaction(async (tx) => {
    const account = await tx.sharedAccount.findUnique({
      where: {
        id: input.accountId
      },
      select: {
        id: true
      }
    });

    if (!account) {
      throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    const existing = await tx.otpAccess.findUnique({
      where: {
        userId_accountId: {
          userId: input.userId,
          accountId: input.accountId
        }
      }
    });

    const nextViews = Math.max(
      0,
      (existing?.remainingViews ?? 0) + input.deltaViews
    );

    const access = await tx.otpAccess.upsert({
      where: {
        userId_accountId: {
          userId: input.userId,
          accountId: input.accountId
        }
      },
      create: {
        userId: input.userId,
        accountId: input.accountId,
        remainingViews: nextViews
      },
      update: {
        remainingViews: nextViews
      }
    });

    await tx.auditLog.create({
      data: {
        userId: input.userId,
        adminId: input.adminId,
        accountId: input.accountId,
        action: AUDIT_ACTIONS.MANUAL_VIEW_ADJUSTMENT,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          deltaViews: input.deltaViews,
          remainingViews: nextViews
        }
      }
    });

    return access;
  });
}

export async function createSharedAccount(
  input: {
    adminId: string;
    name: string;
    totpSecret: string;
    isActive: boolean;
    initialViewsForExistingUsers: number;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  const encryptedSecret = encryptSecret(input.totpSecret);

  return db.$transaction(async (tx) => {
    const account = await tx.sharedAccount.create({
      data: {
        name: input.name,
        encryptedSecret: encryptedSecret.encryptedSecret,
        iv: encryptedSecret.iv,
        authTag: encryptedSecret.authTag,
        isActive: input.isActive
      }
    });

    const users = await tx.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true
      }
    });

    if (users.length > 0) {
      await tx.otpAccess.createMany({
        data: users.map((user) => ({
          userId: user.id,
          accountId: account.id,
          remainingViews: input.initialViewsForExistingUsers
        })),
        skipDuplicates: true
      });
    }

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        accountId: account.id,
        action: AUDIT_ACTIONS.ACCOUNT_CREATED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          name: account.name,
          initialViewsForExistingUsers: input.initialViewsForExistingUsers
        }
      }
    });

    return account;
  });
}

export async function updateSharedAccount(
  input: {
    adminId: string;
    accountId: string;
    name: string;
    totpSecret?: string;
    isActive: boolean;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  const encryptedSecret = input.totpSecret
    ? encryptSecret(input.totpSecret)
    : null;

  return db.$transaction(async (tx) => {
    const existing = await tx.sharedAccount.findUnique({
      where: {
        id: input.accountId
      },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    if (!existing) {
      throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    const account = await tx.sharedAccount.update({
      where: {
        id: input.accountId
      },
      data: {
        name: input.name,
        isActive: input.isActive,
        ...(encryptedSecret
          ? {
              encryptedSecret: encryptedSecret.encryptedSecret,
              iv: encryptedSecret.iv,
              authTag: encryptedSecret.authTag
            }
          : {})
      }
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        accountId: account.id,
        action: AUDIT_ACTIONS.ACCOUNT_UPDATED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          previousName: existing.name,
          name: account.name,
          previousIsActive: existing.isActive,
          isActive: account.isActive,
          secretUpdated: Boolean(encryptedSecret)
        }
      }
    });

    return account;
  });
}

export async function deleteSharedAccount(
  input: {
    adminId: string;
    accountId: string;
    metadata: RequestMetadata;
  },
  db: PrismaClient = prisma
) {
  return db.$transaction(async (tx) => {
    const account = await tx.sharedAccount.findUnique({
      where: {
        id: input.accountId
      },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    });

    if (!account) {
      throw new AppError("Shared account not found", 404, "ACCOUNT_NOT_FOUND");
    }

    await tx.sharedAccount.delete({
      where: {
        id: input.accountId
      }
    });

    await tx.auditLog.create({
      data: {
        adminId: input.adminId,
        action: AUDIT_ACTIONS.ACCOUNT_DELETED,
        ipAddress: input.metadata.ipAddress,
        userAgent: input.metadata.userAgent,
        metadata: {
          deletedAccountId: account.id,
          name: account.name,
          wasActive: account.isActive
        }
      }
    });

    return account;
  });
}
