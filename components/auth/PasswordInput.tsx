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
        className={cx(inputClass, "pr-11", className)}
      />
      <button
        type="button"
        className="absolute right-1 top-1 inline-flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-field"
        onClick={() => setVisible((current) => !current)}
        title={visible ? "Hide password" : "Show password"}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        <Icon size={16} />
      </button>
    </span>
  );
}
