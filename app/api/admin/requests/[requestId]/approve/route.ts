import { NextResponse } from "next/server";
import { reviewAccessRequest } from "@/lib/access-request-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { requestId } = await params;

    const accessRequest = await reviewAccessRequest({
      adminId: admin.id,
      requestId,
      approve: true,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    return jsonError(error);
  }
}
