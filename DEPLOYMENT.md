# Production Deployment

## Required Services

- Vercel project connected to this Git repo
- Neon PostgreSQL database

Use Node.js 24. The `engines.node` setting in `package.json` selects `24.x` for Vercel builds; set the project's Node.js Version to `24.x` if it has a separate runtime setting.

## Production Environment Variables

Set these in Vercel before the first deployment:

```env
DATABASE_URL=
SESSION_SECRET=
ENCRYPTION_KEY=
SEED_ADMIN_USERNAME=
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_MUST_CHANGE_PASSWORD=false
```

`DATABASE_URL` must be a hosted PostgreSQL connection string, for example from Neon or
Supabase. Do not use `localhost`, `127.0.0.1`, or the local Docker URL in Vercel;
Vercel cannot connect to a database running on your laptop.

If you create the database through Vercel's storage/integration UI and it asks for
a custom prefix, use `DATABASE` so it creates `DATABASE_URL`.

Generate `ENCRYPTION_KEY` with:

```sh
openssl rand -base64 32
```

Use a long random `SESSION_SECRET`.

## First Deploy

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the production environment variables.
4. Deploy from Vercel. The Vercel build command runs production migrations,
   seeds the admin user from `SEED_ADMIN_*`, and builds the app with:

   ```sh
   npm run prisma:migrate:deploy && npm run seed && npm run build
   ```

## Before Public Production

- Keep Next.js patched and compatible with Node.js 24.
- Run `npm audit` and address production vulnerabilities.
- Replace local development credentials.
- Keep `.env` out of Git.
