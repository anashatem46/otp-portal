import { NextResponse } from "next/server";
import { AUDIT_ACTIONS } from "@/lib/audit-actions";
import { createAuditLog } from "@/lib/audit";
import { getRequestMetadata, jsonError } from "@/lib/http";
import {
  clearSessionCookie,
  deleteCurrentSession,
  getCurrentUser
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    const metadata = getRequestMetadata(request);
    const user = await getCurrentUser();

    if (user) {
      await createAuditLog({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGOUT,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        metadata: {}
      });
    }

    await deleteCurrentSession();

    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
