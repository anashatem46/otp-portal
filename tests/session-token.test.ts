import { describe, expect, it } from "vitest";
import { createRawSessionToken, hashSessionToken } from "@/lib/session-token";

describe("session tokens", () => {
  it("creates opaque random tokens and stores only hmac hashes", () => {
    const first = createRawSessionToken();
    const second = createRawSessionToken();

    expect(first).not.toBe(second);
    expect(hashSessionToken(first)).not.toBe(first);
    expect(hashSessionToken(first)).toBe(hashSessionToken(first));
    expect(hashSessionToken(first)).not.toBe(hashSessionToken(second));
  });
});
