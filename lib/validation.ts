import { z } from "zod";

export const loginSchema = z.object({
  usernameOrEmail: z.string().trim().min(1, "Enter a username or email."),
  password: z.string().min(1, "Enter a password.")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z
    .string()
    .min(12, "Use at least 12 characters for the new password.")
});

export const createUserSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal("")),
  username: z
    .string()
    .trim()
    .min(3)
    .max(48)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, underscores, or dashes."),
  email: z.string().trim().email().optional().or(z.literal("")),
  temporaryPassword: z.string().min(8),
  role: z.enum(["USER", "ADMIN"]),
  isActive: z.boolean(),
  initialAccess: z
    .array(
      z.object({
        accountId: z.string().min(1),
        remainingViews: z.coerce.number().int().min(0).max(1000)
      })
    )
    .default([])
});

export const createAccountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  totpSecret: z.string().trim().min(6),
  isActive: z.boolean().default(true),
  initialViewsForExistingUsers: z.coerce.number().int().min(0).max(1000).default(1)
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(120),
  totpSecret: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean()
});

export const requestMoreSchema = z.object({
  requestedViews: z.coerce.number().int().min(1).max(100),
  reason: z.string().trim().min(5).max(1000)
});

export const resetPasswordSchema = z.object({
  temporaryPassword: z.string().min(8)
});

export const userStatusSchema = z.object({
  isActive: z.boolean()
});

export const adjustViewsSchema = z.object({
  accountId: z.string().min(1),
  deltaViews: z.coerce.number().int().min(-1000).max(1000).refine((value) => value !== 0, {
    message: "Adjustment cannot be zero."
  })
});

export const rejectRequestSchema = z.object({
  note: z.string().trim().max(500).optional().or(z.literal(""))
});
