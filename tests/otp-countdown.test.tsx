// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OtpCountdown } from "@/components/otp/OtpCountdown";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-27T12:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("OTP countdown", () => {
  it("shows the remaining lifetime and expires exactly once", () => {
    const onExpire = vi.fn();
    render(<OtpCountdown expiresAt={Date.now() + 2500} onExpire={onExpire} />);
    expect(screen.getByLabelText("3 seconds remaining")).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText("2 seconds remaining")).toBeTruthy();
    expect(onExpire).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByLabelText("0 seconds remaining")).toBeTruthy();
    expect(onExpire).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("catches up to elapsed time when returning to a backgrounded tab", () => {
    const onExpire = vi.fn();
    render(<OtpCountdown expiresAt={Date.now() + 30000} onExpire={onExpire} />);
    act(() => {
      vi.setSystemTime(Date.now() + 24500);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByLabelText("6 seconds remaining")).toBeTruthy();
    act(() => {
      vi.setSystemTime(Date.now() + 5500);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("cleans up expiry callbacks when a code is hidden or replaced", () => {
    const onExpire = vi.fn();
    const { unmount } = render(<OtpCountdown expiresAt={Date.now() + 1000} onExpire={onExpire} />);
    unmount();
    act(() => {
      vi.advanceTimersByTime(2000);
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
