import { authenticator } from "otplib";

const STEP_SECONDS = 30;
export const MIN_VISIBLE_OTP_SECONDS = 20;

authenticator.options = {
  digits: 6,
  step: STEP_SECONDS
};

export function generateOtp(secret: string, nowMs = Date.now()) {
  const otp = authenticator.generate(secret);
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
  return authenticator.generateSecret();
}
