import type { ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function StatusBadge({
  tone,
  children
}: {
  tone: "green" | "red" | "yellow" | "blue" | "gray";
  children: ReactNode;
}) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-800",
    red: "border-red-200 bg-red-50 text-red-800",
    yellow: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    gray: "border-slate-200 bg-slate-50 text-slate-700"
  };

  return (
    <span
      className={cx(
        "inline-flex h-6 items-center rounded px-2 text-xs font-medium",
        "border",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}

export const inputClass =
  "h-10 w-full rounded border border-line bg-white px-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const textareaClass =
  "min-h-[88px] w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded border border-transparent bg-moss px-3 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";
