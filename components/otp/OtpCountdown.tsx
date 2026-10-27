"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function OtpCountdown({
  expiresAt,
  onExpire
}: {
  expiresAt: number;
  onExpire: () => void;
}) {
  const [initialRemainingMs] = useState(() => Math.max(0, expiresAt - Date.now()));
  const [seconds, setSeconds] = useState(() => Math.ceil(initialRemainingMs / 1000));
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let expired = false;

    function update() {
      const remainingMs = Math.max(0, expiresAt - Date.now());
      setSeconds(Math.ceil(remainingMs / 1000));

      if (remainingMs === 0 && !expired) {
        expired = true;
        onExpireRef.current();
      }
    }

    update();
    const timer = window.setInterval(update, 100);
    document.addEventListener("visibilitychange", update);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [expiresAt]);

  return (
    <div className="mt-4 flex items-center gap-3 text-moss">
      <Clock3 size={17} className="shrink-0" />
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <span
          className="block h-full origin-left rounded-full bg-moss"
          style={{
            width: `${Math.min(100, initialRemainingMs / 300)}%`,
            animation: `otp-countdown ${initialRemainingMs}ms linear forwards`
          }}
        />
      </span>
      <span className="w-8 text-right text-sm font-semibold tabular-nums" aria-label={`${seconds} seconds remaining`}>
        {seconds}s
      </span>
    </div>
  );
}
