import { NextResponse } from "next/server";
import { setUserActiveStatus } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { userStatusSchema } from "@/lib/validation";

type RouteContext = {
  params: {
    userId: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const body = userStatusSchema.parse(await request.json());

    await setUserActiveStatus({
      adminId: admin.id,
      userId: params.userId,
      isActive: body.isActive,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
