import { describe, expect, it } from "vitest";
import { generateOtp, getOtpExpiresIn, MIN_VISIBLE_OTP_SECONDS } from "@/lib/otp";

describe("otp generation", () => {
  it("returns a six digit code and a bounded expiry", () => {
    const result = generateOtp("JBSWY3DPEHPK3PXP", 1_700_000_000_000);

    expect(result.otp).toMatch(/^\d{6}$/);
    expect(result.expiresIn).toBeGreaterThanOrEqual(1);
    expect(result.expiresIn).toBeLessThanOrEqual(30);
  });

  it("exposes the minimum visible OTP threshold", () => {
    expect(MIN_VISIBLE_OTP_SECONDS).toBe(20);
    expect(getOtpExpiresIn(18_000)).toBe(12);
  });
});
