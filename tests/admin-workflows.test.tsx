// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersClient, type UserRow } from "@/components/admin/AdminUsersClient";
import { AdminAccountsClient } from "@/components/admin/AdminAccountsClient";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const accounts = [{ id: "a1", name: "Design" }, { id: "a2", name: "Finance" }];
const users: UserRow[] = [{ id: "u1", name: "Jane", username: "jane", email: "jane@example.com", role: "USER", isActive: true, mustChangePassword: false, joinedAt: "Oct 27, 2026", lastActiveAt: "Today", otpAccesses: [{ account: accounts[0], remainingViews: 3 }] }];

beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openCreateUser() {
  const user = userEvent.setup();
  render(<AdminUsersClient users={users} accounts={accounts} />);
  const trigger = screen.getByRole("button", { name: "Create user" });
  await user.click(trigger);
  return { user, dialog: within(screen.getByRole("dialog")), trigger };
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>, dialog: ReturnType<typeof within>) {
  await user.type(dialog.getByLabelText("Full name"), "Sara Mansour");
  await user.type(dialog.getByRole("textbox", { name: /Username/ }), "sara_m");
  await user.type(dialog.getByLabelText("Email address"), "sara@example.com");
  await user.type(dialog.getByLabelText("Password"), "temporary123");
}

describe("admin workflows", () => {
  it("preserves credentials and selected grants through role changes and failed submissions", async () => {
    const { user, dialog } = await openCreateUser();
    await fillCredentials(user, dialog);
    expect(dialog.queryByRole("button", { name: "Viewer" })).toBeNull();
    expect((dialog.getByLabelText("Design") as HTMLInputElement).checked).toBe(false);
    await user.click(dialog.getByLabelText("Design"));
    const limit = dialog.getByLabelText("Initial views per selected account");
    await user.clear(limit);
    await user.type(limit, "123");
    expect(document.activeElement).toBe(limit);
    await user.click(dialog.getByRole("button", { name: "Admin" }));
    await user.click(dialog.getByRole("button", { name: "User" }));
    expect((dialog.getByLabelText("Full name") as HTMLInputElement).value).toBe("Sara Mansour");
    expect((dialog.getByLabelText("Password") as HTMLInputElement).value).toBe("temporary123");
    expect((dialog.getByLabelText("Design") as HTMLInputElement).checked).toBe(true);
    expect((dialog.getByLabelText("Initial views per selected account") as HTMLInputElement).value).toBe("123");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Username already exists" }), { status: 409 }));
    await user.click(dialog.getByRole("button", { name: "Create user" }));
    await waitFor(() => expect(dialog.getByRole("alert").textContent).toBe("Username already exists"));
    expect((dialog.getByLabelText("Password") as HTMLInputElement).value).toBe("temporary123");
    const payload = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(payload).toMatchObject({ role: "USER", initialAccess: [{ accountId: "a1", remainingViews: 123 }] });
    expect((dialog.getByRole("button", { name: "Create user" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("creates admins without artificial quota grants", async () => {
    const { user, dialog } = await openCreateUser();
    await fillCredentials(user, dialog);
    await user.click(dialog.getByRole("button", { name: "Admin" }));
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "u2" } })));
    await user.click(dialog.getByRole("button", { name: "Create user" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ role: "ADMIN", initialAccess: [] });
  });

  it("prevents duplicate submits and closing while creation is in flight", async () => {
    const { user, dialog } = await openCreateUser();
    await fillCredentials(user, dialog);
    let finish!: (response: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const submit = dialog.getByRole("button", { name: "Create user" });
    await user.click(submit);
    await user.click(submit);
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
    finish(new Response(JSON.stringify({ error: "Try again" }), { status: 503 }));
    await waitFor(() => expect(dialog.getByRole("alert").textContent).toBe("Try again"));
  });

  it("restores focus on Escape and keeps keyboard focus inside the dialog", async () => {
    const { user, dialog, trigger } = await openCreateUser();
    const submit = dialog.getByRole("button", { name: "Create user" });
    submit.focus();
    await user.tab();
    expect(document.activeElement).toBe(dialog.getByRole("button", { name: "Close create user" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("preserves account secrets and releases pending state after a transport failure", async () => {
    const user = userEvent.setup();
    render(<AdminAccountsClient accounts={[]} />);
    await user.click(screen.getByRole("button", { name: "Add Account" }));
    const dialog = within(screen.getByRole("dialog"));
    await user.type(dialog.getByLabelText("Account Name"), "Team account");
    await user.type(dialog.getByLabelText("TOTP Secret"), "JBSWY3DPEHPK3PXP");
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("Network unavailable"));
    await user.click(dialog.getByRole("button", { name: "Add Account" }));
    await waitFor(() => expect(dialog.getByRole("alert").textContent).toBe("Network unavailable"));
    expect((dialog.getByLabelText("TOTP Secret") as HTMLInputElement).value).toBe("JBSWY3DPEHPK3PXP");
    vi.mocked(fetch).mockResolvedValueOnce(new Response("Bad gateway", { status: 502 }));
    await user.click(dialog.getByRole("button", { name: "Add Account" }));
    await waitFor(() => expect(dialog.getByRole("alert").textContent).toBe("Request failed. Please try again."));
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("keeps a reset password after an API error and describes the current lifecycle", async () => {
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} accounts={accounts} />);
    await user.click(screen.getAllByRole("button", { name: "Reset password" })[0]);
    const dialog = within(screen.getByRole("dialog"));
    const password = dialog.getByLabelText("New password");
    expect((password as HTMLInputElement).minLength).toBe(8);
    await user.type(password, "replacement123");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503 }));
    await user.click(dialog.getByRole("button", { name: "Reset password" }));
    await waitFor(() => expect(dialog.getByRole("alert").textContent).toBe("Database unavailable"));
    expect((password as HTMLInputElement).value).toBe("replacement123");
    expect(dialog.queryByText(/asked to change/)).toBeNull();
  });

  it("preserves edited account fields after a failed save", async () => {
    const user = userEvent.setup();
    render(<AdminAccountsClient accounts={[{ id: "a1", name: "Design", category: null, sharedByLabel: null, isActive: true, createdAt: "Oct 27, 2026", _count: { otpAccesses: 0, accessRequests: 0 } }]} />);
    await user.click(screen.getByTitle("Edit account"));
    const name = screen.getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "New design account");
    await user.type(screen.getByLabelText("New TOTP secret"), "JBSWY3DPEHPK3PXP");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Unable to save" }), { status: 503 }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByText("Unable to save")).toBeTruthy());
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("New design account");
    expect((screen.getByLabelText("New TOTP secret") as HTMLInputElement).value).toBe("JBSWY3DPEHPK3PXP");
  });

  it.each(["desktop", "mobile"])("adjusts an account quota from the %s controls", async (layout) => {
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} accounts={accounts} />);
    const table = screen.getByRole("table");
    let trigger: HTMLElement;
    if (layout === "desktop") {
      await user.click(table.querySelector("summary")!);
      trigger = within(table).getByRole("button", { name: "Adjust views" });
    } else {
      const details = document.querySelector("details.group")!;
      await user.click(details.querySelector("summary")!);
      trigger = within(details as HTMLElement).getByRole("button", { name: "Adjust views" });
    }
    await user.click(trigger);
    const dialog = within(screen.getByRole("dialog"));
    await user.selectOptions(dialog.getByLabelText("Account"), "a2");
    await user.clear(dialog.getByLabelText("View adjustment"));
    await user.type(dialog.getByLabelText("View adjustment"), "-2");
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ access: { remainingViews: 5 } })));
    await user.click(dialog.getByRole("button", { name: "Apply adjustment" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toEqual({ accountId: "a2", deltaViews: "-2" });
    expect(screen.getByText("Views adjusted. Remaining views: 5.")).toBeTruthy();
  });
});
