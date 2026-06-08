import { NextResponse } from "next/server";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { createAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { hashPassword, verifyPassword } from "@/lib/password";
import { requireUser } from "@/lib/session";
import { changePasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = changePasswordSchema.parse(await request.json());
    const metadata = getRequestMetadata(request);

    const fullUser = await prisma.user.findUnique({
      where: {
        id: user.id
      }
    });

    if (!fullUser) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const currentPasswordMatches = await verifyPassword(
      fullUser.passwordHash,
      body.currentPassword
    );

    if (!currentPasswordMatches) {
      throw new AppError("Current password is incorrect", 400, "BAD_PASSWORD");
    }

    const passwordHash = await hashPassword(body.newPassword);

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        passwordHash,
        mustChangePassword: false
      }
    });

    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: {}
    });

    return NextResponse.json({ redirectTo: "/dashboard" });
  } catch (error) {
    return jsonError(error);
  }
}
