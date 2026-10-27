import { NextResponse } from "next/server";
import { reviewAccessRequest } from "@/lib/access-request-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { rejectRequestSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { requestId } = await params;
    const body = rejectRequestSchema.parse(await request.json());

    const accessRequest = await reviewAccessRequest({
      adminId: admin.id,
      requestId,
      approve: false,
      note: body.note || undefined,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ request: accessRequest });
  } catch (error) {
    return jsonError(error);
  }
}
