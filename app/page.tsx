import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser({ allowDatabaseUnavailable: true });

  if (!user) {
    redirect("/login");
  }

  redirect(user.mustChangePassword ? "/change-password" : "/dashboard");
}
