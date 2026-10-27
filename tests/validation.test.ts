import { describe, expect, it } from "vitest";
import { createUserSchema, requestMoreSchema, resetPasswordSchema } from "@/lib/validation";

describe("input validation", () => {
  it("accepts valid user creation payloads", () => {
    expect(
      createUserSchema.parse({
        username: "jane.doe",
        email: "jane@example.com",
        temporaryPassword: "temporary",
        role: "USER",
        isActive: true,
        initialAccess: []
      })
    ).toMatchObject({
      username: "jane.doe",
      role: "USER"
    });
  });

  it("rejects oversized access requests", () => {
    expect(() =>
      requestMoreSchema.parse({
        requestedViews: 101,
        reason: "Need more views"
      })
    ).toThrow();
  });

  it.each(["123456", "1234567"])("rejects short managed passwords: %s", (password) => {
    expect(resetPasswordSchema.safeParse({ temporaryPassword: password }).success).toBe(false);
    expect(createUserSchema.safeParse({ username: "jane", temporaryPassword: password, role: "USER", isActive: true }).success).toBe(false);
  });

  it("accepts an eight-character managed password", () => {
    expect(resetPasswordSchema.parse({ temporaryPassword: "12345678" }).temporaryPassword).toBe("12345678");
  });
});
