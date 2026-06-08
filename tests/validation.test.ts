import { describe, expect, it } from "vitest";
import { createUserSchema, requestMoreSchema } from "@/lib/validation";

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
});
