"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { secondaryButtonClass } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", {
      method: "POST"
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      className={secondaryButtonClass}
      onClick={logout}
      disabled={pending}
      title="Log out"
    >
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  );
}
