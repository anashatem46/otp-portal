import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || undefined;
    const userId = url.searchParams.get("userId") || undefined;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    const logs = await prisma.auditLog.findMany({
      where: {
        action,
        OR: userId ? [{ userId }, { adminId: userId }] : undefined,
        createdAt:
          from || to
            ? {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined
              }
            : undefined
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        admin: {
          select: {
            username: true,
            email: true
          }
        },
        account: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return jsonError(error);
  }
}
