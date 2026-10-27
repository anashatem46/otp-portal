import type { ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* --- Account Avatar --- */

export function AccountAvatar({
  name,
  size = "sm"
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  const initials = name
    .split(/[\s-]+/)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center bg-[#eaf4ef] font-bold tracking-wide text-moss",
        size === "lg"
          ? "h-14 w-14 rounded-xl text-xl"
          : "h-10 w-10 rounded-lg text-sm"
      )}
    >
      {initials}
    </span>
  );
}

/* --- Category Badge --- */

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-500">
      {category}
    </span>
  );
}

/* --- Status Badge --- */

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

/* --- Empty State --- */

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-4 py-8 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

/* --- Shared class strings --- */

export const inputClass =
  "h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const textareaClass =
  "min-h-[92px] w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-moss px-5 text-sm font-semibold text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-semibold text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";

export const cardClass =
  "rounded-lg border border-line bg-white shadow-panel";

export const modalBackdropClass =
  "fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 px-4 py-6 backdrop-blur-sm";

export const modalPanelClass =
  "w-full overflow-hidden rounded-xl border border-line bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]";

export const iconButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-field hover:text-ink";
