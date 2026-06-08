import { NextResponse } from "next/server";
import { deleteSharedAccount, updateSharedAccount } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { updateAccountSchema } from "@/lib/validation";

type RouteContext = {
  params: {
    accountId: string;
  };
};

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const body = updateAccountSchema.parse(await request.json());

    const account = await updateSharedAccount({
      adminId: admin.id,
      accountId: params.accountId,
      name: body.name,
      totpSecret: body.totpSecret || undefined,
      isActive: body.isActive,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({
      account: {
        id: account.id,
        name: account.name,
        isActive: account.isActive
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();

    await deleteSharedAccount({
      adminId: admin.id,
      accountId: params.accountId,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
