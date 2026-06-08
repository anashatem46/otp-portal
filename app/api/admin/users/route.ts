import { NextResponse } from "next/server";
import { createManagedUser } from "@/lib/admin-service";
import { getRequestMetadata, jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { createUserSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = createUserSchema.parse(await request.json());

    const user = await createManagedUser({
      adminId: admin.id,
      name: body.name || undefined,
      username: body.username,
      email: body.email || `${body.username.toLowerCase()}@local.otp`,
      temporaryPassword: body.temporaryPassword,
      role: body.role,
      isActive: body.isActive,
      initialAccess: body.initialAccess,
      metadata: getRequestMetadata(request)
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
