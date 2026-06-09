import "server-only";

import type { User } from "@prisma/client";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { RequestMetadata } from "@/lib/http";
import {
  createRawSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionExpiryDate
} from "@/lib/session-token";

export type AuthenticatedUser = Pick<
  User,
  "id" | "name" | "username" | "email" | "role" | "isActive" | "mustChangePassword"
>;

export async function createSession(userId: string, metadata: RequestMetadata) {
  const token = createRawSessionToken();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiryDate(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    }
  });

  return token;
}

export function attachSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token)
    }
  });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token)
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true
        }
      }
    }
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: {
        id: session.id
      }
    });
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  return user;
}

export async function requireOperationalUser() {
  const user = await requireUser();

  if (user.mustChangePassword) {
    throw new AppError(
      "Password change required",
      403,
      "PASSWORD_CHANGE_REQUIRED"
    );
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireOperationalUser();

  if (user.role !== Role.ADMIN) {
    throw new AppError("Admin access required", 403, "ADMIN_REQUIRED");
  }

  return user;
}
