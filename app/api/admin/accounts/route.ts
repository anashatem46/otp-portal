import { NextResponse } from "next/server";
import { createSharedAccount } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { createAccountSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = createAccountSchema.parse(await request.json());

    const account = await createSharedAccount({
      adminId: admin.id,
      name: body.name,
      totpSecret: body.totpSecret,
      isActive: body.isActive,
      initialViewsForExistingUsers: body.initialViewsForExistingUsers,
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
