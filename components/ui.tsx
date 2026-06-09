import type { ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* --- Account Avatar --- */

const AVATAR_COLORS = [
  "bg-[#355e43]", // emerald / moss
  "bg-[#0d9488]", // teal
  "bg-[#2563eb]", // blue
  "bg-[#7c3aed]", // violet
  "bg-[#e11d48]", // rose
  "bg-[#d97706]", // amber
  "bg-[#475569]", // slate
  "bg-[#0891b2]"  // cyan
];

function hashString(str: string) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

export function AccountAvatar({ name }: { name: string }) {
  const initials = name
    .split(/[\s-]+/)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = hashString(name) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];

  return (
    <span
      className={cx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold tracking-wide text-white",
        colorClass
      )}
    >
      {initials}
    </span>
  );
}

/* --- Category Badge --- */

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex h-5 items-center rounded px-1.5 text-[11px] font-medium text-slate-500 bg-slate-100">
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
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const textareaClass =
  "min-h-[88px] w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15";

export const buttonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent bg-moss px-4 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink transition hover:bg-field disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50";
