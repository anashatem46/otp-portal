import { createGuardrails, generateSecret, generateSync } from "otplib";

const STEP_SECONDS = 30;
const MIN_COMPATIBLE_SECRET_BYTES = 10;
export const MIN_VISIBLE_OTP_SECONDS = 20;
const OTP_GUARDRAILS = createGuardrails({
  MIN_SECRET_BYTES: MIN_COMPATIBLE_SECRET_BYTES
});

export function generateOtp(secret: string, nowMs = Date.now()) {
  const otp = generateSync({
    secret,
    digits: 6,
    period: STEP_SECONDS,
    epoch: Math.floor(nowMs / 1000),
    guardrails: OTP_GUARDRAILS
  });
  const expiresIn = getOtpExpiresIn(nowMs);

  return {
    otp,
    expiresIn
  };
}

export function getOtpExpiresIn(nowMs = Date.now()) {
  const elapsed = Math.floor(nowMs / 1000) % STEP_SECONDS;

  return elapsed === 0 ? STEP_SECONDS : STEP_SECONDS - elapsed;
}

export function generateTotpSecret() {
  return generateSecret();
}
