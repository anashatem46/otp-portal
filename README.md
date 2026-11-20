# OTP Sharing Portal

OTP Sharing Portal gives teams a central place to access two-factor authentication codes for shared accounts. When a shared service asks for a time-based one-time password (TOTP), a team member opens the portal, reveals the current six-digit code, and copies it into the service’s sign-in screen. The portal generates codes on the server and stores the underlying TOTP secrets encrypted.

## How it works

The screenshots below use fictional accounts and demo data.

### Reveal a code from the dashboard

Choose a shared account and select **View OTP**. The dashboard shows the code, a copy button, and a countdown to expiration. Each reveal uses one view from the member’s quota for that account. When the quota runs out, the member can select **Request more OTP** and track the request under **Requests**.

![Member dashboard showing a revealed six-digit code, its expiration countdown, remaining views, and an account with no views available](docs/screenshots/member-dashboard.png)

### Review requests for more views

Admins can see who requested access, the account, the reason, and the number of views requested. They can approve or reject the request. Approval adds the requested views to the member’s quota for that account.

![Admin Requests page showing a pending request for three Cloud Console views and the review actions](docs/screenshots/admin-requests.png)

### Manage shared accounts

Admins add accounts with Base32 TOTP secrets, activate or deactivate accounts, and manage view quotas. The **Audit** page records activity such as code reveals and request decisions.

![Admin Accounts page showing the Add Account button and an account’s category, status, and management actions](docs/screenshots/admin-accounts.png)

## Run locally

You’ll need Node.js 24, npm, and a PostgreSQL database. The repository includes a Docker Compose configuration for PostgreSQL 16. You can also use a hosted database such as Neon.

### 1. Clone and install

```sh
git clone https://github.com/anashatem46/otp-portal.git
cd otp-portal
nvm use # If you manage Node.js with nvm
npm ci
cp .env.example .env
```

### 2. Configure the database and environment

For local PostgreSQL, start the bundled database and set `DATABASE_URL` in `.env` to `postgresql://user:password@localhost:5432/otp`. For hosted PostgreSQL, use the connection string provided by your host.

```sh
docker compose up -d --wait postgres
```

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `SESSION_SECRET` | Random string of at least 24 characters. Generate one with `openssl rand -hex 32`. |
| `ENCRYPTION_KEY` | Base64-encoded 32-byte key for encrypting TOTP secrets. Generate one with `openssl rand -base64 32`. |
| `SEED_ADMIN_USERNAME` and `SEED_ADMIN_EMAIL` | Username and email for the first administrator. |
| `SEED_ADMIN_PASSWORD` | Password for the first administrator. |
| `SEED_ADMIN_MUST_CHANGE_PASSWORD` | Set to `true` to require a password change at first sign-in. Defaults to `false`. |

### 3. Apply migrations and start the portal

```sh
npm run prisma:migrate:deploy
npm run seed
npm run dev
```

Open <http://localhost:3000> and sign in with the seeded administrator credentials. Use **Accounts** to add a shared account with its Base32 TOTP secret, then use **Users** to create a team member and assign views.

The seed command updates the password, role, and active status of an existing user if the username or email matches.

## Development

The portal uses Next.js with the App Router, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Generate Next.js types and check TypeScript. |
| `npm test` | Run the Vitest suite. |
| `npm run build` | Create a production build. |
| `npm run prisma:migrate` | Create and apply a migration during development. |
| `npm run prisma:generate` | Regenerate Prisma Client after schema changes. |

## Deployment

The repository includes Vercel configuration for Node.js 24. The build applies database migrations, seeds the administrator, and builds the app. Use a hosted PostgreSQL database and keep production credentials in your hosting provider’s environment settings. Keep `.env` out of version control.

Follow the [deployment guide](DEPLOYMENT.md).

## License

[MIT](LICENSE)
