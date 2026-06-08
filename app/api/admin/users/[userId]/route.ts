import { NextResponse } from "next/server";
import { deleteManagedUser } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

type RouteContext = {
  params: {
    userId: string;
  };
};

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    await deleteManagedUser({
      adminId: admin.id,
      userId: params.userId,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
