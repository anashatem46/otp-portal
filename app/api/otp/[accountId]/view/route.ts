import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { getOtpExpiresIn, MIN_VISIBLE_OTP_SECONDS } from "@/lib/otp";
import { requireOperationalUser } from "@/lib/session";
import { viewOtpForUser } from "@/lib/otp-service";

type RouteContext = {
  params: Promise<{
    accountId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireOperationalUser();
    const { accountId } = await params;
    const metadata = getRequestMetadata(request);
    await enforceRateLimit(
      `otp-view:${user.id}:${metadata.ipAddress ?? "unknown"}`
    );

    const currentExpiresIn = getOtpExpiresIn();

    if (currentExpiresIn < MIN_VISIBLE_OTP_SECONDS) {
      return NextResponse.json(
        {
          retryAfter: currentExpiresIn + 1,
          expiresIn: currentExpiresIn
        },
        { status: 202 }
      );
    }

    const result = await viewOtpForUser({
      userId: user.id,
      accountId,
      metadata,
      unlimited: user.role === Role.ADMIN
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
