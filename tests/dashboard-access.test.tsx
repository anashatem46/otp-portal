// @vitest-environment jsdom

import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/dashboard/page";
import { prisma } from "@/lib/db";
import { requirePageUser } from "@/lib/page-auth";

vi.mock("@/lib/db", () => ({ prisma: { sharedAccount: { findMany: vi.fn() } } }));
vi.mock("@/lib/page-auth", () => ({ requirePageUser: vi.fn() }));
vi.mock("@/components/layout/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <>{children}</> }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("dashboard access", () => {
  it.each([undefined, 0, 1])("keeps admin access unlimited with quota %s", async (remainingViews) => {
    vi.mocked(requirePageUser).mockResolvedValue({ id: "admin-1", role: "ADMIN" } as never);
    vi.mocked(prisma.sharedAccount.findMany).mockResolvedValue([{
      id: "a1", name: "Shared account", category: null, sharedByLabel: null,
      otpAccesses: remainingViews === undefined ? [] : [{ remainingViews }]
    }] as never);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ otp: "123456", expiresIn: 30 }))));
    render(await DashboardPage());
    const user = userEvent.setup();
    expect(screen.getByText("Unlimited")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "View OTP" }));
    await waitFor(() => expect(screen.getByTitle("Hide OTP")).toBeTruthy());
    await user.click(screen.getByTitle("Hide OTP"));
    expect((screen.getByRole("button", { name: "View OTP" }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText("Unlimited")).toBeTruthy();
  });

  it("keeps ordinary users blocked when their quota is exhausted", async () => {
    vi.mocked(requirePageUser).mockResolvedValue({ id: "user-1", role: "USER" } as never);
    vi.mocked(prisma.sharedAccount.findMany).mockResolvedValue([{
      id: "a1", name: "Shared account", category: null, sharedByLabel: null, otpAccesses: [{ remainingViews: 0 }]
    }] as never);
    render(await DashboardPage());
    expect((screen.getByRole("button", { name: "View OTP" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Unlimited")).toBeNull();
  });
});
