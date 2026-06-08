import { NextResponse } from "next/server";
import { resetUserPassword } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { resetPasswordSchema } from "@/lib/validation";

type RouteContext = {
  params: {
    userId: string;
  };
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const body = resetPasswordSchema.parse(await request.json());

    await resetUserPassword({
      adminId: admin.id,
      userId: params.userId,
      temporaryPassword: body.temporaryPassword,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
