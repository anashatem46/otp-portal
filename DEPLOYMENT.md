# Production Deployment

## Required Services

- Vercel project connected to this Git repo
- Neon PostgreSQL database

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

Generate `ENCRYPTION_KEY` with:

```sh
openssl rand -base64 32
```

Use a long random `SESSION_SECRET`.

## First Deploy

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the production environment variables.
4. Run database migrations against Neon:

   ```sh
   npm run prisma:migrate:deploy
   ```

5. Seed the first admin:

   ```sh
   npm run seed
   ```

6. Deploy from Vercel.

## Before Public Production

- Upgrade Next.js to a patched release compatible with Node 20.
- Run `npm audit` and address production vulnerabilities.
- Replace local development credentials.
- Keep `.env` out of Git.
