import "server-only";

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export async function requirePageUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return user;
}

export async function requirePageAdmin() {
  const user = await requirePageUser();

  if (user.role !== Role.ADMIN) {
    redirect("/dashboard");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  redirect(user.mustChangePassword ? "/change-password" : "/dashboard");
}
