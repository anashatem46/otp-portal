import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";

const DATABASE_UNAVAILABLE_CODE = "DATABASE_UNAVAILABLE";
const CONNECTION_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017"
]);

export function databaseUnavailableError() {
  return new AppError(
    "Database is unavailable. Please start PostgreSQL and try again.",
    503,
    DATABASE_UNAVAILABLE_CODE
  );
}

export function isDatabaseUnavailableError(error: unknown) {
  if (
    error instanceof AppError &&
    error.code === DATABASE_UNAVAILABLE_CODE
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    CONNECTION_ERROR_CODES.has(error.code)
  ) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /Can't reach database server|ECONNREFUSED|connect ECONNREFUSED|Connection refused|P1001/i.test(
    error.message
  );
}
