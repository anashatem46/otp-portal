"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function ChangePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword")
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to change password.");
      setPending(false);
      return;
    }

    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Current password
        <PasswordInput
          name="currentPassword"
          autoComplete="current-password"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        New password
        <PasswordInput
          name="newPassword"
          autoComplete="new-password"
          minLength={12}
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={buttonClass} disabled={pending}>
        <LockKeyhole size={16} />
        {pending ? "Saving" : "Change password"}
      </button>
    </form>
  );
}
