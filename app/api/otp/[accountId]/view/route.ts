import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireOperationalUser } from "@/lib/session";
import { viewOtpForUser } from "@/lib/otp-service";

type RouteContext = {
  params: {
    accountId: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireOperationalUser();
    const metadata = getRequestMetadata(request);
    await enforceRateLimit(
      `otp-view:${user.id}:${metadata.ipAddress ?? "unknown"}`
    );

    const result = await viewOtpForUser({
      userId: user.id,
      accountId: params.accountId,
      metadata,
      unlimited: user.role === Role.ADMIN
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
