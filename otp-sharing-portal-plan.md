# OTP Sharing Portal

## Goal

Build an internal OTP Sharing Portal for a small team where authorized users can access a shared account's TOTP code with controlled permissions.

Each user receives **1 OTP view by default**. Additional views require admin approval.

---

## Tech Stack

- Next.js
- TypeScript
- PostgreSQL (Neon)
- Prisma ORM
- Vercel Hosting
- Auth via HttpOnly Cookies
- TOTP Generation using `otplib`
- Password Hashing using `argon2`
- Secret Encryption using AES-256-GCM

---

## Core Features

### Authentication

Implement:

- Login
- Logout
- Session Management
- Admin-created users only
- Force password change on first login
- Admin password reset

There is **no public signup**.

Only the admin can create users manually and send them their credentials.

User fields:

- Username
- Email
- Password Hash
- Role (`user` / `admin`)
- Active Status
- Must Change Password

Only authenticated active users can access the portal.

---

### User Creation

Only admins can create users.

When creating a user, the admin sets:

- Username
- Email
- Temporary Password
- Role (`user` / `admin`)
- Active Status
- Initial OTP Views

After the user is created, the admin sends the username and temporary password to the user.

Recommended behavior:

- User must change password on first login
- Temporary password should not be visible again after creation
- Admin can reset a user's password
- User creation must be logged
- Password resets must be logged
- Disabled users cannot log in or view OTP codes


---

### Shared Account Management

Store:

- Account Name
- Encrypted TOTP Secret
- Encryption IV
- Auth Tag

Requirements:

- Never expose the TOTP Secret
- Never expose the original QR Code
- Decrypt only on the backend

---

### OTP Access System

Each user has access limits per shared account.

Rules:

- Default: `remainingViews = 1`
- Viewing an OTP consumes 1 view
- Refreshing the page does not grant additional access
- When views reach 0, OTP access is blocked
- User must submit an access request

---

### OTP Viewing Flow

Endpoint:

```http
POST /api/otp/:accountId/view
```

Flow:

1. Validate session
2. Load user access record
3. Check remaining views
4. Start database transaction
5. Decrement remaining views
6. Decrypt TOTP secret
7. Generate current OTP
8. Create audit log
9. Return:

```json
{
  "otp": "123456",
  "expiresIn": 18
}
```

---

### Request Additional Views

Endpoint:

```http
POST /api/otp/:accountId/request-more
```

Payload:

```json
{
  "requestedViews": 1,
  "reason": "Need access again"
}
```

Creates a pending request for admin review.

---

## Admin Dashboard

Admins can:

- Create users
- Set temporary passwords
- Reset user passwords
- View users
- View remaining OTP views
- Approve requests
- Reject requests
- Add views manually
- Enable or disable users
- View audit logs

---

## Approval Flow

When admin approves a request:

1. Mark request as approved
2. Add requested views
3. Store admin ID
4. Store review timestamp
5. Create audit log

---

## Audit Logging

Track:

- OTP Viewed
- OTP Blocked
- Access Request Submitted
- Request Approved
- Request Rejected
- User Created
- Password Changed
- Password Reset by Admin
- User Disabled
- User Enabled
- Manual View Adjustments

Log fields:

```ts
{
  userId,
  adminId,
  accountId,
  ipAddress,
  userAgent,
  action,
  metadata,
  timestamp
}
```

---

## Database Models

### User

```ts
id
name
username
email
passwordHash
role
isActive
mustChangePassword
createdAt
updatedAt
```

### SharedAccount

```ts
id
name
encryptedSecret
iv
authTag
createdAt
```

### OtpAccess

```ts
id
userId
accountId
remainingViews
updatedAt
```

### AccessRequest

```ts
id
userId
accountId
requestedViews
reason
status
reviewedBy
reviewedAt
createdAt
```

### AuditLog

```ts
id
userId
adminId
accountId
action
ipAddress
userAgent
metadata
createdAt
```

---

## Security Requirements

- HTTPS only
- HttpOnly Secure Cookies
- Argon2 password hashing
- AES-256-GCM encryption
- Encryption key stored in environment variables
- Never expose TOTP secret
- Never expose QR code
- Rate limit OTP endpoints
- Validate all input using Zod
- Role-based authorization
- Audit all sensitive actions

---

## User Pages

### Login

- Username or Email
- Password

If `mustChangePassword = true`, redirect user to change password before accessing the dashboard.

### Dashboard

- Remaining Views
- View OTP Button
- Request More Access Button

### Access Requests

- Request Status
- Previous Requests

---

## Admin Pages

### Dashboard

Overview of:

- Users
- Accounts
- Pending Requests

### User Management

- Create Users
- Set Temporary Passwords
- Reset Passwords
- View Users
- Enable/Disable Users
- Adjust Views

### Request Management

- Approve Requests
- Reject Requests

### Audit Logs

- Search Logs
- Filter by User
- Filter by Date
- Filter by Action

---

## Deployment

### Frontend & API

- Vercel

### Database

- Neon PostgreSQL

### Environment Variables

```env
DATABASE_URL=
JWT_SECRET=
ENCRYPTION_KEY=
```

---

## MVP Acceptance Criteria

- Admin can create users manually
- Admin can set a temporary password
- User can log in using admin-provided credentials
- User is forced to change password on first login
- Admin can reset a user's password
- User can view OTP once
- Viewing OTP decreases remaining views
- User cannot view OTP when views reach zero
- User can request more views
- Admin can approve/reject requests
- Approved requests add views
- Secret is encrypted at rest
- Secret never reaches frontend
- Audit logs are generated
- Application is deployed on Vercel
- Database runs on Neon
