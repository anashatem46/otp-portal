# Changes review and implementation plan

Reviewed the working tree against HEAD on 2026-10-27, including the new settings page and database error helper. This is a source review; browser flows and a live PostgreSQL database were not exercised. No application code was changed during the review.

Validation: all 14 tests across 7 files pass; `npm run typecheck` and `npm run lint` pass. Existing OTP tests mock the transaction client, so passing tests do not establish database rollback or concurrency behavior.

## Implementation progress

### Phase 1 — Workflow repairs implemented

- Extracted user creation, password reset, account creation, and account edit forms into stable module-scope components. Failed submissions preserve entered values and display errors inside dialogs.
- User creation now offers Admin and User, matching the persisted roles. Ordinary users receive finite quotas only on explicitly selected accounts; no accounts are selected by default. Admins receive unlimited access through their role without artificial quota grants.
- Corrected the dashboard's admin unlimited rule for absent, zero, and positive access rows.
- Restored quota adjustment through a shared dialog reachable from desktop and mobile. The success message reports the server's resulting balance.
- Restored the eight-character managed-password minimum and shared password policy constants between forms and validation. Reset text accurately describes session invalidation without promising forced rotation; service lifecycle behavior is unchanged.
- Added a shared request helper for the repaired admin flows, releasing pending state on transport errors and malformed responses. Controls remain disabled during mutations and route refresh transitions.
- Added shared dialog keyboard focus containment, focus restoration, Escape handling, scroll locking, and protection against closing during an in-flight mutation. Stabilized row components so their action triggers survive parent updates.
- Replaced the invented user quota maximum and progress bar with remaining views.

Verification: 30 tests across 9 files pass, including interaction tests in jsdom for form preservation, role changes, explicit grants, failed submissions, pending controls, keyboard focus, account editing, desktop/mobile quota actions, and admin dashboard access. TypeScript, lint, and production build pass. These are DOM interaction tests with mocked APIs; real-browser layout checks and live database tests remain outstanding.

Next: phase 2, covering OTP minimum lifetime and absolute expiry, persisted denied audits, accurate concurrent balances, and authentication/database failure behavior. Phases 3 and 4 remain queued; this first implementation does not claim those phases are complete.

### Follow-up and integration with main

- Replaced the once-per-second timer-bar steps with a continuous linear animation. Countdown labels use elapsed time from a client deadline and catch up on tab visibility changes. Exact server expiry and minimum usable lifetime remain phase 2 work.
- Integrated the latest main branch while preserving its Next.js 16, React 19, OTP library, async route/cookie APIs, and deployment configuration. Updated DOM testing dependencies for React 19 and adjusted ref synchronization to satisfy the current React lint rules.
- Integration verification: all 33 tests pass across 10 files; typecheck, lint, production build, and whitespace checks pass. Real-browser visual checks and live-database transaction tests remain outstanding.

## Findings in priority order

### 1. P1 — Modal components remount and discard form input

`components/admin/AdminUsersClient.tsx:269` defines `CreateUserModal` inside the parent component and renders it as `<CreateUserModal />` at line 1032. Every parent state change creates a new component identity. Changing role, switching quota mode, or typing into the controlled quota input therefore remounts the modal: uncontrolled name, username, email, and password fields reset, and focus is lost. Submission also changes parent state. The reset-password and create-account modals use the same pattern.

Fix: move stateful/form components to module scope and pass explicit props. Keep submission errors inside the open dialog; currently they render behind the overlay. Preserve form values on failures.

Acceptance: fill every field, change role and quota options, type a multi-digit limit, and submit an invalid/duplicate user. Values and focus remain stable and the error is visible inside the dialog. Cover create-user, reset-password, and create-account forms with browser regression tests.

### 2. P1 — User creation promises permissions the server does not implement

`components/admin/AdminUsersClient.tsx:218` translates “Unlimited” to 1000 views per existing account. At line 226 both Member and Viewer become `USER`; the schema only supports `USER` and `ADMIN`. Viewer has the same request permissions as Member, and “Unlimited” eventually expires. Creating any user also silently assigns access to every active account, replacing the previous per-account selection.

Fix first: expose the existing Admin/User roles, finite quota terminology, and explicit account selection. Keep admin unlimited access derived from its role. Treat a real Viewer role or unlimited non-admin access as a separate feature requiring persisted permissions, API enforcement, migrations, and authorization tests.

Acceptance: the UI describes exactly what is saved and enforced; only selected accounts receive grants; users with a finite quota become blocked at zero. New-account behavior is explicit.

### 3. P1 — Admin dashboard applies a quota the API ignores

`app/dashboard/page.tsx:44` marks an admin unlimited only when no access row exists. The OTP route always passes `unlimited: user.role === Role.ADMIN`. Account creation generates access rows for active users including admins, making this mismatch common. The dashboard locally decrements the displayed quota and eventually disables viewing even though the server still allows it.

Fix: use the same role-based unlimited rule in the dashboard and API, and avoid local decrements for unlimited users.

Acceptance: admins with absent, positive, or zero quota rows can view active accounts and always see Unlimited; ordinary users remain limited.

### 4. P2 — Manual quota adjustment disappeared from desktop

`components/admin/AdminUsersClient.tsx:925` renders the desktop table without `UserManagementControls`. The desktop action menu offers only enable/disable, reset password, and delete. The quota adjustment form survives only in the mobile details layout.

Fix: add an Adjust views action opening a shared dialog from desktop and mobile, with account selection and signed adjustment.

Acceptance: both layouts can grant and remove account-specific views and show the resulting server balance.

### 5. P2 — OTP requests can spend a view on a nearly expired code

The change removes the minimum-lifetime check from `app/api/otp/[accountId]/view/route.ts` and removes the client's 202 retry handling. A click near a 30-second boundary now consumes quota for a code with only one or two seconds left; network delay can exhaust that lifetime before display.

Fix: restore a documented minimum usable lifetime, checking it after authorization and before quota consumption. Handle the retry response without decrementing quota. Use an absolute expiry timestamp in the client so network delay and background-tab timer throttling do not leave expired codes visible.

Acceptance: boundary-time requests do not spend quota on unusable codes; retrying yields a fresh code; returning to a backgrounded tab hides expired codes immediately.

### 6. P2 — Newly displayed statistics do not measure their labels

`components/admin/AdminAccountsClient.tsx:78` sums access records as “Active Users”, counting the same user across accounts and including disabled users. Line 86 counts all account audit logs as “Total Views”, including account edits and access requests. `AdminUsersClient.tsx:565` invents a quota denominator from current remaining views and account count, so the progress bar does not represent an allocated limit. `app/admin/users/page.tsx:51` derives “Last active” from session creation; logging out deletes that session and can make a previously active user read “Never”.

Fix: count distinct active users and `OTP_VIEWED` events; display remaining views without an invented maximum; rename activity to a precisely defined metric or persist a real activity timestamp. In request cards, say “Additional views” and show the resulting total: approval adds the requested number rather than replacing the balance. The admin home currently passes null for every current balance, which is displayed as zero; query the balance or show Unknown.

Acceptance: fixtures with one user on multiple accounts, disabled users, mixed audit actions, and logged-out users yield accurate labels and values.

### 7. P2 — Password minimum was lowered without matching lifecycle guarantees

`lib/validation.ts:24` and `:60` lower temporary-password requirements from eight characters to six. Existing `createManagedUser` and `resetUserPassword` both set `mustChangePassword: false`, so these credentials can remain permanent. The new reset dialog incorrectly promises a password change on next login.

Fix: restore at least the previous minimum immediately; define one password policy and share it between UI and validation. Make the reset message match behavior. If temporary credentials are intended, enforce rotation in both service methods and verify the operational-route restrictions before rollout.

Acceptance: short passwords fail server validation, form guidance matches the policy, and any claimed forced rotation is enforced on the next login and protected API calls.

## Existing weaknesses exposed by this change

- Blocked OTP audits are created inside the transaction and followed by a throw, so the transaction rolls the audit back. The new concurrency-blocked branch inherits this problem. Return a denied outcome from the transaction and throw after it commits, with a nullable account reference for unknown IDs. Verify persisted audits against real PostgreSQL.
- The conditional decrement correctly prevents quota going negative, but `remainingViewsAfter` uses an earlier read. Two successful concurrent requests can report the same balance. Obtain the actual balance from the atomic update or a locked/serialized operation. Test simultaneous requests with one and multiple remaining views.
- Client fetch helpers lack `try/catch/finally`; transport errors and non-JSON responses can leave actions stuck pending. Add a shared request helper that preserves form values, reports errors, and always releases pending state. Keep actions disabled until refreshed data arrives to reduce accidental repeats.
- Database outage handling maps an unavailable session lookup to anonymous on pages. Show a temporary-unavailability state while continuing to deny access. Logout can still fail if the audit write fails after session lookup; ensure cookie clearing and session revocation have explicit failure behavior and tests.

## Delivery sequence

1. **Repair workflows:** stabilize modal components and inline errors; align roles and quotas with server behavior; restore explicit account grants, admin unlimited display, and desktop quota adjustment. Restore the password minimum. Add regression tests for these failures.
2. **Harden OTP and authentication:** implement minimum lifetime and absolute expiry; persist denied audits; correct concurrent audit balances; handle transport errors and database outages. Add live PostgreSQL transaction tests and route tests.
3. **Finish the interface:** correct metrics and request labels; replace static Settings cards with an accurately labeled informational page until settings exist. Remove or implement the inert Request Additional Access button, selection checkboxes, and notification badge. Add dialog focus trapping/restoration, Escape handling, accessible feedback, and mobile navigation expansion state.
4. **Prepare for growth:** add real pagination and bounded server queries for users, accounts, requests, and audits; make desktop tables fit common screen widths; centralize shared modal, clipboard, and request behavior after the workflow repairs are stable.

Complete each phase with focused checks. Final release validation should include tests, typecheck, lint, production build, and browser smoke checks at mobile and desktop sizes with admin and ordinary user sessions. No production build or browser smoke checks were run in this review.
