"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { buttonClass, inputClass } from "@/components/ui";
import { PasswordInput } from "@/components/auth/PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usernameOrEmail: form.get("usernameOrEmail"),
        password: form.get("password")
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Unable to log in.");
      setPending(false);
      return;
    }

    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium">
        Username or email
        <input
          className={inputClass}
          name="usernameOrEmail"
          autoComplete="username"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Password
        <PasswordInput
          name="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className={buttonClass} disabled={pending}>
        <KeyRound size={16} />
        {pending ? "Logging in" : "Login"}
      </button>
    </form>
  );
}
