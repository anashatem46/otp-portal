import { createHmac, randomBytes } from "crypto";
import { AppError } from "@/lib/errors";

export const SESSION_COOKIE_NAME = "otp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function createRawSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 24) {
    throw new AppError(
      "SESSION_SECRET must be configured with at least 24 characters",
      500,
      "CONFIG_ERROR"
    );
  }

  return createHmac("sha256", secret).update(token).digest("hex");
}

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}
