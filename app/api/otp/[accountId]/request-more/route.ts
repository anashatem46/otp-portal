import { NextResponse } from "next/server";
import { submitAccessRequest } from "@/lib/access-request-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireOperationalUser } from "@/lib/session";
import { requestMoreSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    accountId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await requireOperationalUser();
    const { accountId } = await params;
    const body = requestMoreSchema.parse(await request.json());
    const metadata = getRequestMetadata(request);

    const accessRequest = await submitAccessRequest({
      userId: user.id,
      accountId,
      requestedViews: body.requestedViews,
      reason: body.reason,
      metadata
    });

    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    return jsonError(error);
  }
}
