import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { AppError } from "@/lib/errors";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

type EncryptedSecret = {
  encryptedSecret: string;
  iv: string;
  authTag: string;
};

export function getEncryptionKey() {
  const rawKey = process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    throw new AppError("ENCRYPTION_KEY is not configured", 500, "CONFIG_ERROR");
  }

  const key = Buffer.from(rawKey, "base64");

  if (key.length !== KEY_LENGTH_BYTES) {
    throw new AppError(
      "ENCRYPTION_KEY must be a base64-encoded 32-byte key",
      500,
      "CONFIG_ERROR"
    );
  }

  return key;
}

export function encryptSecret(secret: string): EncryptedSecret {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret.trim(), "utf8"),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedSecret: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64")
  };
}

export function decryptSecret(secret: EncryptedSecret) {
  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(secret.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(secret.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(secret.encryptedSecret, "base64")),
    decipher.final()
  ]).toString("utf8");
}
