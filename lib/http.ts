import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";

export type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

export function getRequestMetadata(request: Request): RequestMetadata {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;

  return {
    ipAddress,
    userAgent: request.headers.get("user-agent") ?? undefined
  };
}

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  console.error(error);

  return NextResponse.json(
    { error: "Something went wrong", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}

export function parseJsonObject(value: unknown): Prisma.InputJsonValue {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Prisma.InputJsonValue;
  }

  return {};
}
