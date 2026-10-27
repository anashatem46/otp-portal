"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { modalBackdropClass } from "@/components/ui";

export function Modal({
  titleId,
  onClose,
  busy = false,
  children
}: {
  titleId: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(
      panel.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
      ) ?? []
    );
    (panel.current?.querySelector<HTMLElement>('input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled)') ?? focusable()[0] ?? panel.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busyRef.current) closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        panel.current?.focus();
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocus(event: FocusEvent) {
      if (!panel.current?.contains(event.target as Node)) {
        (focusable()[0] ?? panel.current)?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocus);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <div ref={panel} className={modalBackdropClass} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} tabIndex={-1}>
      {children}
    </div>
  );
}

export function FormError({ error }: { error: string }) {
  return error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null;
}
