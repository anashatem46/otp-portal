import { NextResponse } from "next/server";
import { adjustUserViews } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { adjustViewsSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;
    const body = adjustViewsSchema.parse(await request.json());

    const access = await adjustUserViews({
      adminId: admin.id,
      userId,
      accountId: body.accountId,
      deltaViews: body.deltaViews,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ access });
  } catch (error) {
    return jsonError(error);
  }
}
