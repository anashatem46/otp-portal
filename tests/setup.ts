process.env.SESSION_SECRET = "test-session-secret-with-enough-entropy";
process.env.ENCRYPTION_KEY = Buffer.from(
  "0123456789abcdef0123456789abcdef",
  "utf8"
).toString("base64");
