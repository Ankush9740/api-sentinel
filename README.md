# API Sentinel

API Sentinel is a focused developer tool for configuring, executing, validating, saving, and reviewing HTTP API requests. Phases 0–7 are implemented: the responsive workspace, GitHub and Google authentication, Neon persistence, collections and saved endpoints, secure server-side execution, response inspection, assertions, bounded execution history, and encrypted sensitive headers.

The product requirements and implementation sequence live in [`docs/`](./docs). Read all four specification documents before beginning significant implementation.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to the ignored `.env.local` file and configure the variables below.
3. Generate the Prisma client with `npm run db:generate`.
4. Apply the checked-in migration chain with `npx prisma migrate deploy`.
5. Start the app with `npm run dev`.

Open [http://localhost:3000](http://localhost:3000).

## Database and authentication configuration

Create a Neon project and copy its pooled connection string to `DATABASE_URL`. Copy the direct connection string to `DIRECT_URL`; Prisma CLI migrations use this direct URL while the application uses the pooled URL.

In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App** and use:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Set `AUTH_URL` to the canonical application origin (`http://localhost:3000` locally and the canonical HTTPS origin in production). Set the returned credentials as `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`, then generate a private `AUTH_SECRET` with `npx auth secret`. Keep all authentication values and both database URLs only in `.env.local` or another ignored environment source. The GitHub OAuth callback is always `<AUTH_URL>/api/auth/callback/github`; register both the local and production callback URLs in GitHub.

In Google Cloud Console, configure the OAuth consent screen and create an OAuth 2.0 Client ID for a **Web application**. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. This server-side Auth.js flow does not require an authorized JavaScript origin; if you choose to register one for local development, use `http://localhost:3000`. Set the credentials as `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. Google sign-in is omitted from the Auth.js provider registry until both values are present, so an incomplete local Google configuration does not affect GitHub sign-in. The Google OAuth callback is always `<AUTH_URL>/api/auth/callback/google`; register the exact HTTPS callback separately for production.

The repository contains four migrations covering the Auth.js/application schema, assertions, execution history, and encrypted-header metadata. Use `npx prisma migrate status` to confirm the configured database is current. When intentionally changing the schema during development, create a new checked-in migration with `npm run db:migrate -- --name descriptive_name`; do not rename or recreate the existing migration chain.

## Phase 7 encryption key

Sensitive saved request headers use AES-256-GCM authenticated encryption. Generate a dedicated 32-byte key locally and store only its canonical Base64 form in the ignored `.env.local` file:

```bash
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64'))"
```

Set the output as `ENCRYPTION_KEY`. Do not reuse `AUTH_SECRET`, expose this key to client code, or commit it. Back up the key securely: losing or rotating it without first re-encrypting stored values makes existing encrypted headers unrecoverable. API Sentinel intentionally fails closed when the key is missing, malformed, wrong, or when ciphertext authentication fails.

## Production deployment notes

- Response bodies are read with a hard 4 MiB (4,194,304-byte) limit so the non-streamed V1 execution response stays below Vercel's 4.5 MB Function payload ceiling with room for the API response envelope.
- Before public traffic is enabled, publish this Vercel Firewall rate-limit rule for the execution endpoint:
  - Conditions, combined with `AND`: `Request Path` → `Equals` → `/api/execute`; `Method` → `Equals` → `POST`; `Environment` → `Equals` → `Production`.
  - Action: `Rate Limit`; strategy: `Fixed Window`; time window: `60s`; request limit: `60`; counting key: `IP`; follow-up action: `Default (429)`.
  - In the Vercel project, open **Firewall → Configure → + New Rule**, save the rule, then use **Review Changes → Publish**. A saved draft does not enforce the limit.
  - Vercel tracks this as 60 requests per 60 seconds per source IP per region. The Hobby plan supports one rate-limit rule per project with fixed-window IP/JA4 counting and includes the first 1,000,000 allowed requests. If that single Hobby rule is already in use, consolidate the protection into it or use a plan that supports additional rules before deployment. See Vercel's [WAF rate-limiting documentation](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) and [rule configuration reference](https://vercel.com/docs/vercel-firewall/vercel-waf/rule-configuration).
- The in-application limit of 60 executions per minute per authenticated user and four concurrent executions is process-local defense-in-depth. It is not presented as cross-instance rate or concurrency enforcement; Vercel Firewall is the required platform-level, cross-instance request-rate control for `/api/execute`.
- Collection and saved-request storage is authenticated and owner-scoped, but this release does not impose per-user storage quotas. A public deployment should apply account-level quotas and operational database monitoring.
- Auth.js manages database session tokens and OAuth account tokens through its standard Prisma adapter. Treat database access as highly privileged, restrict it to the application and migration roles, and use provider/platform encryption at rest.
- Keep the application behind HTTPS in production, register the exact production OAuth callback, and set `AUTH_URL` to that canonical HTTPS origin.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Prisma-specific checks are available as `npm run db:validate` and `npm run db:generate`. Never commit real secrets.
