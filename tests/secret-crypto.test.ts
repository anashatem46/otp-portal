import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/secret-crypto";

describe("secret encryption", () => {
  it("round-trips TOTP secrets without exposing plaintext fields", () => {
    const encrypted = encryptSecret("JBSWY3DPEHPK3PXP");

    expect(encrypted.encryptedSecret).not.toContain("JBSWY3DPEHPK3PXP");
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.authTag).toBeTruthy();
    expect(decryptSecret(encrypted)).toBe("JBSWY3DPEHPK3PXP");
  });
});
