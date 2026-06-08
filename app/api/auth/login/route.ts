import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, getRequestMetadata } from "@/lib/http";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { AppError } from "@/lib/errors";
import { attachSessionCookie, createSession } from "@/lib/session";
import { createAuditLog } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const usernameOrEmail = body.usernameOrEmail.toLowerCase();
    const metadata = getRequestMetadata(request);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
      }
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await verifyPassword(user.passwordHash, body.password);

    if (!passwordMatches) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const token = await createSession(user.id, metadata);
    await createAuditLog({
      userId: user.id,
      action: AUDIT_ACTIONS.LOGIN,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      metadata: {}
    });

    const response = NextResponse.json({
      redirectTo: user.mustChangePassword ? "/change-password" : "/dashboard"
    });
    attachSessionCookie(response, token);

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
