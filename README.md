# API Sentinel

API Sentinel is a focused developer tool for testing, validating, saving, and analyzing HTTP APIs. The repository contains the approved Phase 0 interface and the Phase 1 persistence/authentication foundation using Prisma, Neon PostgreSQL, Auth.js, and GitHub OAuth.

The product requirements and implementation sequence live in [`docs/`](./docs). Read all four specification documents before beginning significant implementation.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to the ignored `.env.local` file and configure the variables below.
3. Apply the initial schema with `npm run db:migrate -- --name init`.
4. Start the app with `npm run dev`.

Open [http://localhost:3000](http://localhost:3000).

## Phase 1 configuration

Create a Neon project and copy its pooled connection string to `DATABASE_URL`. Copy the direct connection string to `DIRECT_URL`; Prisma CLI migrations use this direct URL while the application uses the pooled URL.

In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App** and use:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Set the returned credentials as `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. Generate a private `AUTH_SECRET` with `npx auth secret`. Keep all four values and both database URLs only in `.env.local` or another ignored environment source.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Prisma-specific checks are available as `npm run db:validate` and `npm run db:generate`. Never commit real secrets.
