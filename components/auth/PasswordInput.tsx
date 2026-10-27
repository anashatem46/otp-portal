"use client";

import { Eye, EyeOff } from "lucide-react";
import { InputHTMLAttributes, useState } from "react";
import { cx, inputClass } from "@/components/ui";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <span className="relative block">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cx(inputClass, className, "password-field !pr-16")}
      />
      <button
        type="button"
        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-transparent text-slate-500 transition hover:border-line hover:bg-white hover:text-ink focus-visible:border-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/20"
        onClick={() => setVisible((current) => !current)}
        title={visible ? "Hide password" : "Show password"}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon size={22} />
      </button>
    </span>
  );
}
