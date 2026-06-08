import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export async function enforceRateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000
) {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({
    where: {
      key
    }
  });

  if (!existing) {
    await prisma.rateLimit.create({
      data: {
        key,
        count: 1,
        windowStart: now
      }
    });
    return;
  }

  const windowExpired =
    now.getTime() - existing.windowStart.getTime() >= windowMs;

  if (windowExpired) {
    await prisma.rateLimit.update({
      where: {
        key
      },
      data: {
        count: 1,
        windowStart: now
      }
    });
    return;
  }

  if (existing.count >= limit) {
    throw new AppError("Too many requests. Try again shortly.", 429, "RATE_LIMITED");
  }

  await prisma.rateLimit.update({
    where: {
      key
    },
    data: {
      count: {
        increment: 1
      }
    }
  });
}
