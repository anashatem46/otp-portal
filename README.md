# OTP Sharing Portal

Internal Next.js portal for controlled access to shared TOTP codes.

## Setup

Use Node.js 24 (`nvm use` reads the version from `.nvmrc`).

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy environment variables:

   ```sh
   cp .env.example .env
   ```

3. Fill in:

   - `DATABASE_URL`: Neon PostgreSQL connection string
   - `SESSION_SECRET`: long random string, at least 24 characters
   - `ENCRYPTION_KEY`: base64 encoded 32-byte key
   - `SEED_ADMIN_USERNAME`
   - `SEED_ADMIN_EMAIL`
   - `SEED_ADMIN_PASSWORD`

   Generate an encryption key with:

   ```sh
   openssl rand -base64 32
   ```

4. Apply migrations and seed the first admin:

   ```sh
   npm run prisma:migrate:deploy
   npm run seed
   ```

5. Run locally:

   ```sh
   npm run dev
   ```

## Local Docker Database

For local development without Neon:

```sh
docker compose up -d
npm run prisma:migrate:deploy
npm run seed
npm run dev
```

Seeded users are not forced to change their password, so they open the dashboard directly after login. Use private local credentials in `.env`; do not reuse local development passwords in production.

## Useful Commands

```sh
npm run prisma:generate
npm run typecheck
npm run lint
npm test
npm run build
```

## Security Note

This repo targets Node `24.x` for local development and production. Keep Next.js patched and run `npm audit` before public deployments.
