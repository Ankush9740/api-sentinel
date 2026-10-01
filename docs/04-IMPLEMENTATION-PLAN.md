# API Sentinel
## Implementation Plan — V1

**Version:** 1.1  
**Document:** `04-IMPLEMENTATION-PLAN.md`

**Source of Truth:**
- `01-PRD.md`
- `02-TECHNICAL-SPEC.md`
- `03-UI-UX.md`
- `04-IMPLEMENTATION-PLAN.md`

---

# 1. Objective

Build and deploy a complete, secure and polished API Sentinel V1 without unnecessary scope expansion.

The finished application must support:

**Authenticate → Create Collection → Configure API → Execute Real Request → Inspect Response → Add Assertions → Save → Re-run → Review History → View Analytics**

The product must work against real APIs using real persisted data.

Priority order:

1. Correctness
2. Security
3. Complete core workflow
4. Reliability
5. User experience
6. Performance
7. Optional features

---

# 2. Codex Working Rules

Before modifying code, Codex must read:

- `01-PRD.md`
- `02-TECHNICAL-SPEC.md`
- `03-UI-UX.md`
- `04-IMPLEMENTATION-PLAN.md`

These documents define the product requirements, architecture, security requirements, visual system and implementation sequence.

Codex must:

- Work one phase at a time.
- Inspect existing code before modifying it.
- Preserve completed functionality.
- Avoid unnecessary dependencies.
- Avoid unrelated refactors.
- Never replace real functionality with mocks.
- Never fabricate analytics or request results.
- Never weaken security requirements for convenience.
- Follow `03-UI-UX.md` for visual implementation.
- Run validation after every phase.
- Fix failures before moving forward.
- Report exactly what was changed.
- Report blockers instead of silently changing architecture.

Do not push to GitHub or deploy unless explicitly requested.

Do not begin later phases merely because related code would be convenient to add.

---

# 3. UI/UX Implementation Rule

All visual implementation must follow:

`03-UI-UX.md`

Codex must not independently redesign the application.

In particular, preserve the specified:

- Application shell
- Sidebar/navigation
- Dashboard hierarchy
- Collections interface
- Request workspace
- Request tabs
- Response inspector
- History interface
- Loading states
- Empty states
- Error states
- Responsive behavior
- Visual hierarchy
- Interaction patterns

Avoid generic generated-dashboard styling.

Do not introduce:

- Excessive gradients
- Glassmorphism
- Neon/cyberpunk styling
- Floating decorative objects
- Huge marketing-style headings
- Excessive rounded cards
- Random animations
- AI-themed visuals
- Unnecessary dashboard widgets

API Sentinel should look like a professional developer tool.

---

# 4. Phase 0 — Repository & Foundation

## Goal

Establish a clean, production-ready project foundation without implementing database, authentication or API execution yet.

## Build

Create the Next.js application using:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- ESLint

Establish the project structure described in the Technical Specification.

Expected high-level structure:

```text
src/
├── app/
├── components/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── request-executor/
│   ├── assertions/
│   ├── encryption/
│   ├── security/
│   └── validation/
└── types/

prisma/

tests/

docs/
```

Create:

- `.env.example`
- Correct `.gitignore`
- Shared type location
- Validation utilities location
- Database utilities location
- Security utilities location
- Request executor location
- Assertion engine location

Do not create fake implementations merely to populate these directories.

## AGENTS.md

Create a lightweight root-level `AGENTS.md`.

It should instruct future Codex work to:

- Read the four specification documents.
- Follow the implementation phases.
- Preserve security requirements.
- Avoid mock functionality.
- Avoid unrelated refactors.
- Run required verification.
- Follow the UI/UX specification.

Keep it concise.

## UI Foundation

Following `03-UI-UX.md`, establish reusable foundations for:

- Typography
- Spacing
- Colors
- Surfaces
- Borders
- Buttons
- Inputs
- Selects
- Tabs
- Badges
- Dialogs
- Loading states
- Error states
- Empty states
- Focus states
- Responsive application shell

Prioritize the dark developer-tool interface defined in the UI/UX specification.

Do not spend significant time on decorative animation.

## Phase 0 Restrictions

Do NOT yet implement:

- Neon
- Prisma models
- Auth.js
- GitHub OAuth
- API execution
- Assertions
- History
- Analytics

Those belong to later phases.

## Verify

Run:

```text
npm run lint
npm run build
```

TypeScript must pass.

Check the application manually for:

- Runtime errors
- Console errors
- Horizontal overflow
- Broken responsive shell

## Done When

The application starts locally and provides a clean responsive foundation with no known TypeScript, lint or production-build errors.

---

# 5. Phase 1 — Database + Authentication

## Goal

Establish real persistence, identity and protected user workspaces.

## Database

Configure:

**Neon PostgreSQL + Prisma**

Implement required Auth.js models plus the application domain models required by the Technical Specification.

Core application models:

- User
- Collection
- Endpoint
- RequestHeader
- QueryParameter
- Assertion
- RequestRun
- AssertionResult

Create the initial migration.

Use appropriate:

- Relations
- Foreign keys
- Constraints
- Indexes
- Enums
- Cascade behavior

Do not manually modify the production schema outside the migration system.

## Authentication

Configure:

**Auth.js + GitHub OAuth**

Implement:

- Sign in
- Sign out
- Session handling
- GitHub OAuth
- Protected application routes
- Authenticated user retrieval

## Authorization

Create reusable server-side ownership checks.

Never trust a browser-provided:

```text
userId
```

The authenticated identity must come from the server-side session.

## Initial UI

Implement according to `03-UI-UX.md`:

- Landing/login page
- Application shell
- Sidebar
- User menu
- Dashboard empty state
- Mobile navigation

Do not turn the landing page into a large marketing website.

## Tests

Verify:

- Unauthenticated protected access is denied.
- Authentication succeeds.
- Authenticated user receives a workspace.
- User-owned records are scoped correctly.
- Session expiry/failure is handled cleanly.

## Verify

Run:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

If `typecheck` does not yet exist, add an appropriate script.

## Done When

A real GitHub user can sign in and reach a protected workspace backed by PostgreSQL.

---

# 6. Phase 2 — Collections & Saved Endpoints

## Goal

Allow authenticated users to organize and persist API configurations.

## Collections

Implement:

- Create
- Read
- Update
- Delete

Fields:

- Name
- Optional description
- Created timestamp
- Updated timestamp

Require confirmation before destructive deletion.

## Saved Endpoints

Implement:

- Create
- Read
- Update
- Delete

Endpoint configuration includes:

- Name
- Collection
- HTTP method
- URL
- Query parameters
- Headers
- JSON body

Supported methods:

```text
GET
POST
PUT
PATCH
DELETE
```

## Authorization

Every query and mutation must verify ownership.

Direct ID manipulation must never expose another user's resources.

Test cross-user access explicitly.

## UI

Following `03-UI-UX.md`, implement:

- Collections page
- Collection detail
- Endpoint list
- Endpoint editor foundation
- Create/edit dialogs where appropriate
- Delete confirmation
- Empty states
- Loading states
- Error states

Prefer compact developer-oriented lists over oversized cards.

## Verify

Test:

- Collection CRUD
- Endpoint CRUD
- Persistence after reload
- Ownership boundaries
- Invalid inputs
- Destructive actions

Then run:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

## Done When

A user can create a collection, save endpoints inside it, edit them, reload the application and still see the persisted configuration.

---

# 7. Phase 3 — Real API Request Engine

## Goal

Implement the core engineering feature of API Sentinel.

This is the highest-priority backend milestone.

Do not rush or weaken security requirements.

## Request Builder

Implement:

- HTTP method selector
- URL input
- Query parameters
- Headers
- JSON request body
- Send action

The user must be able to execute an unsaved request.

Do not require saving before testing.

## Server Execution Pipeline

Implement:

```text
Browser
   ↓
Execution Endpoint
   ↓
Authentication
   ↓
Zod Validation
   ↓
Request Normalization
   ↓
URL Validation
   ↓
SSRF Protection
   ↓
Timeout Protection
   ↓
Outbound HTTP Request
   ↓
Bounded Response Reading
   ↓
Response Normalization
   ↓
Return Safe Result
```

## SSRF Protection

Implement the protections defined in `02-TECHNICAL-SPEC.md`.

At minimum block:

- localhost
- loopback
- private IPv4 ranges
- private IPv6 ranges
- link-local addresses
- unsafe internal destinations
- cloud metadata destinations

Only allow:

```text
http:
https:
```

Do not use naive string matching as the primary security mechanism.

## Redirect Security

Redirects must be manually or safely controlled.

Every redirect destination must be revalidated.

Enforce a small redirect limit.

## Timeout

Initial target:

```text
10 seconds
```

Use an abort mechanism.

Timeouts must return a normalized execution result rather than an unexplained application failure.

## Request Size

Initial JSON body target:

```text
1 MB maximum
```

## Response Size

Initial execution maximum:

```text
4 MiB (4,194,304 bytes)
```

Do not read unlimited responses into memory.

## Metrics

Capture:

- HTTP status
- Duration
- Response size
- Response headers
- Response body
- Content type

Use server-side timing.

## Error Categories

Differentiate:

- Timeout
- DNS failure
- Connection failure
- TLS failure
- Invalid request
- Blocked target
- Oversized response
- Internal application failure

HTTP responses such as:

```text
400
401
403
404
429
500
503
```

are valid target HTTP responses.

Do not classify them as API Sentinel internal failures.

## Security Tests

At minimum verify:

```text
Public HTTPS URL → allowed

localhost → blocked

127.0.0.1 → blocked

10.x.x.x → blocked

172.16–31.x.x → blocked

192.168.x.x → blocked

link-local → blocked

private IPv6 → blocked

unsafe redirect → blocked

timeout → normalized

404 → valid HTTP response

500 → valid HTTP response

oversized response → rejected safely
```

## Manual Verification

Execute real public APIs.

Verify:

- GET
- POST JSON
- Query parameters
- Custom safe headers

## Verify

Run:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

## Done When

API Sentinel can safely execute real HTTP requests from its backend and return genuine normalized results.

---

# 8. Phase 4 — Response Inspector

## Goal

Make API responses easy to understand.

## Response Summary

Display:

```text
200 OK
243 ms
1.8 KB
```

## Tabs

Implement:

- Body
- Headers
- Tests

The Tests tab may remain inactive/empty until Phase 5 where appropriate.

## Body

Pretty-print valid JSON.

Safely display text responses.

Never execute returned HTML.

Never use unsanitized response content as active DOM markup.

## Headers

Display normalized response headers using a compact key/value layout.

## HTTP Errors

Example:

```text
401 Unauthorized
127 ms
312 B
```

Display the actual response body.

Do not show a generic network-error screen simply because the target returned non-2xx.

## Execution Errors

Create distinct UI for:

- Timeout
- Network failure
- Invalid URL
- Security block
- Oversized response

## Responsive Behavior

Desktop:

Maximize request/response workspace.

Mobile:

Stack request and response sections.

No horizontal page overflow.

Code areas may scroll internally.

## Verify

Test:

- JSON response
- Plain text
- Empty body
- Invalid/malformed JSON
- 401
- 404
- 429
- 500
- Long responses
- Long URLs

## Done When

A developer can clearly understand what the target API returned without opening browser developer tools.

---

# 9. Phase 5 — Assertion Engine

## Goal

Allow developers to validate real API responses without executing arbitrary code.

## V1 Assertions

Implement:

### Status Code

```text
status equals 200
```

### Response Time

```text
response time < 500 ms
```

### JSON Property Exists

```text
body.user.id exists
```

### JSON Property Equals

```text
body.status equals "success"
```

### Header Exists

```text
content-type exists
```

## Security

Never use:

- `eval`
- arbitrary JavaScript
- dynamically executed expressions
- user-controlled server code

Assertions operate only on normalized response data.

## UI

Implement the assertion builder defined in `03-UI-UX.md`.

Example:

```text
Status Code     equals       200

Response Time   less than    500 ms

JSON Property   exists
body.user.id
```

Results:

```text
✓ Status equals 200

✓ Response time < 500 ms

✕ body.active equals true
  Expected: true
  Received: false

2 / 3 passed
```

## Tests

Test every assertion type for:

- Passing case
- Failing case
- Missing target
- Unexpected type
- Non-JSON response where relevant

## Done When

Assertions execute deterministically against actual target responses and clearly report pass/fail results.

---

# 10. Phase 6 — History + Persistence

## Goal

Allow users to understand previous API executions.

Persist bounded execution metadata.

Store:

- User
- Saved endpoint reference when applicable
- Method
- URL
- Timestamp
- HTTP status
- Duration
- Response size
- Content type
- Bounded response snapshot
- Execution status
- Error category
- Assertion results

## Response Persistence

Do not persist unlimited response bodies.

Use the bounded persistence strategy defined in the Technical Specification.

Large responses may preserve metadata while truncating or omitting stored body content.

## History Page

Following `03-UI-UX.md`, provide:

- Recent executions
- Method
- Endpoint
- Status
- Duration
- Timestamp
- Assertion result summary
- Pagination

## History Detail

Show:

- Execution timestamp
- Method
- URL
- Status
- Duration
- Response size
- Response body snapshot
- Headers where retained
- Assertion results
- Error category if execution failed

Historical records should primarily be read-only.

## Retention

Implement conservative history retention.

Do not permit unlimited database growth.

## Done When

A user can execute an endpoint, return later and inspect the previous execution.

---

# 11. Phase 7 — Sensitive Data Protection

## Goal

Protect stored API credentials and other sensitive request values.

## Encryption

Implement authenticated server-side encryption according to `02-TECHNICAL-SPEC.md`.

Sensitive saved header values must be:

- Encrypted before database persistence
- Decrypted only server-side when required
- Masked in normal UI
- Excluded from analytics
- Redacted from logs

## Key Management

Encryption key:

- Server-only
- Environment variable
- Cryptographically random
- Never committed to Git

## Redaction

Implement reusable secret-redaction utilities.

Never log:

- Authorization values
- Cookies
- API keys
- OAuth secrets
- Encryption keys

## UI

Sensitive header example:

```text
Authorization
Bearer ••••••••••••••
```

Reveal/edit behavior must be intentional.

## Tests

Verify:

```text
plaintext
↓
encryption
↓
ciphertext differs from plaintext

ciphertext
↓
decryption
↓
original value

tampered ciphertext
↓
rejected

logs
↓
secret absent
```

## Done When

Inspecting the database does not reveal protected saved header values as ordinary plaintext.

---

# 12. Phase 8 — Dashboard + Analytics

## Goal

Provide a useful overview derived entirely from real data.

## Metrics

Implement:

- Saved endpoints
- Total requests
- Successful HTTP requests
- Execution failures
- Average response time
- Assertion pass rate

Display recent executions.

## Analytics Definition

Clearly distinguish:

```text
HTTP success
```

from:

```text
execution success
```

A target `500` is still a completed HTTP execution even though it is not a successful HTTP status.

## UI

Follow `03-UI-UX.md`.

Metrics should be compact and useful.

Avoid oversized decorative cards.

Optional:

A lightweight response-time history visualization.

Do not introduce a heavy chart dependency solely for one small graph unless justified.

## No Fake Data

A new account should show:

```text
0 endpoints
0 requests
```

Never fabricate analytics for visual appearance.

## Done When

Real request executions correctly update dashboard metrics and recent activity.

---

# 13. Phase 9 — Search + UX Polish

## Goal

Polish the completed product without changing its architecture.

Only begin when core functionality works.

## Search

Implement useful search for:

- Collections
- Endpoints

## UX Polish

Following `03-UI-UX.md`, verify and improve:

- Keyboard accessibility
- Focus states
- Loading states
- Empty states
- Error states
- Confirmation dialogs
- Responsive navigation
- Request editor
- Response inspector
- History
- Mobile layouts
- Dark theme consistency

## Performance

Avoid laggy UI behavior.

Prefer lightweight transitions.

Do not introduce expensive blur/shadow/scale animations.

## Edge Cases

Check:

- Horizontal overflow
- Layout shift
- Long URLs
- Long endpoint names
- Deep JSON
- Huge JSON responses
- Empty responses
- Slow requests
- Repeated Send clicks
- Narrow mobile screens

## Required Sizes

Desktop approximately:

```text
1440px
1280px
1024px
```

Mobile approximately:

```text
390px
360px
```

## Done When

The application feels intentionally designed around API testing rather than like generated CRUD pages.

---

# 14. Phase 10 — Security & Reliability Audit

## Goal

Audit the complete application before production deployment.

## Authentication

Verify:

- Protected routes
- Session behavior
- Sign out
- Expired/invalid sessions

## Authorization

Attempt cross-user access to:

- Collections
- Endpoints
- Assertions
- History

User A must not access User B's resources.

## SSRF

Retest:

- localhost
- loopback
- private IPv4
- private IPv6
- link-local
- metadata destinations
- unsafe redirects

## Secrets

Search repository and logs for:

- Database credentials
- OAuth secrets
- API keys
- Authorization tokens
- Encryption keys

## Validation

Attempt malformed:

- URLs
- Headers
- Params
- JSON
- Assertions
- IDs

## Database

Verify:

- Constraints
- Relations
- Indexes
- Migrations
- Ownership
- Retention behavior

## Error Handling

Test:

- Database failure behavior
- Expired session
- Timeout
- DNS failure
- Connection failure
- Malformed JSON
- HTTP 401
- HTTP 404
- HTTP 429
- HTTP 500
- Unreachable host
- Oversized response

## Repository

Confirm no real:

```text
.env
credentials
API keys
OAuth secrets
encryption keys
```

are committed.

## Done When

No known high-priority security or reliability issue remains.

---

# 15. Phase 11 — Production Verification

Before deployment run:

```text
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Every command must pass.

Also verify:

- No unresolved TypeScript errors
- No runtime console errors
- No known hydration errors
- No horizontal overflow
- No broken core route
- No accidental secrets
- No mock production data

Do not deploy while known core failures remain.

---

# 16. Phase 12 — Deployment

## Goal

Deploy the verified application.

Deploy:

**Application:** Vercel

**Database:** Neon PostgreSQL

**Authentication:** Auth.js + GitHub OAuth

Configure production environment variables for:

- Database
- Auth.js
- GitHub OAuth
- Encryption
- Application URL

Apply database migrations using the correct production-safe Prisma workflow.

Update GitHub OAuth callback configuration for production.

## Production Smoke Test

Perform the complete flow:

```text
Sign in with GitHub
        ↓
Dashboard
        ↓
Create Collection
        ↓
Create Endpoint
        ↓
Configure GET
        ↓
Send
        ↓
Inspect Real Response
        ↓
Add Assertion
        ↓
Run Again
        ↓
Save
        ↓
Configure POST + JSON
        ↓
Send
        ↓
Inspect Response
        ↓
Open History
        ↓
Inspect Previous Run
        ↓
Open Dashboard
        ↓
Verify Metrics
        ↓
Sign Out
        ↓
Sign Back In
        ↓
Verify Persisted Data
```

Also verify production on mobile.

## Done When

The deployed application performs the complete V1 workflow against real APIs.

---

# 17. Features Explicitly Deferred

Do NOT implement these before V1 is complete:

- Scheduled monitoring
- Email alerts
- Webhook alerts
- AI debugging
- AI-generated assertions
- AI-generated tests
- Team workspaces
- Collaboration
- GraphQL-specific tooling
- WebSocket testing
- gRPC
- Environment-variable system
- Pre-request scripting
- Arbitrary JavaScript tests
- Import/export
- CLI
- Desktop application
- Billing
- Subscription plans

These are not required for V1 success.

---

# 18. Optional Post-V1 Development

Only after V1 is completely functional, tested and deployed.

Recommended order:

```text
1. Scheduled endpoint monitoring

2. Failure / recovery incidents

3. Email notifications

4. Response comparison

5. Environment variables

6. Import / export
```

Do not jump directly to AI functionality.

---

# 19. Development Budget Rule

Additional development capacity does NOT justify uncontrolled scope expansion.

If budget becomes constrained:

**Reduce polish before reducing correctness.**

Protect:

```text
Authentication
Database
Authorization
Request execution
SSRF protection
Response handling
Assertions
History
Sensitive-data protection
```

Reduce first:

```text
Animations
Advanced charts
Complex search
Secondary analytics
Visual extras
Optional post-V1 features
```

A smaller application that works completely is preferable to a large unfinished application.

---

# 20. Git Strategy

After every stable milestone:

```text
git status
git diff
```

Review all changes before committing.

Use focused commits.

Suggested progression:

```text
Initialize API Sentinel foundation

Add authentication and database

Add collection and endpoint management

Implement secure API request executor

Add response inspector

Add assertion engine

Add request history

Protect stored API credentials

Add dashboard analytics

Polish responsive application UI

Complete security and reliability audit

Prepare production deployment
```

Do not combine unrelated experimental work into milestone commits.

Do not push unless explicitly requested.

---

# 21. Final Acceptance Test

API Sentinel V1 is finished only when this complete workflow works:

```text
GitHub Login
     ↓
Protected Workspace
     ↓
Create Collection
     ↓
Create Endpoint
     ↓
Configure GET / POST / PUT / PATCH / DELETE
     ↓
Add Query Parameters
     ↓
Add Headers
     ↓
Add JSON Body
     ↓
Send
     ↓
Real Target API Called
     ↓
Response Displayed
     ↓
Status + Time + Size Displayed
     ↓
Assertions Evaluated
     ↓
Endpoint Saved
     ↓
Execution Stored
     ↓
History Available
     ↓
Analytics Updated
     ↓
Sign Out
     ↓
Sign Back In
     ↓
Data Still Available
```

The application must also correctly handle:

```text
Invalid URL
Timeout
Blocked SSRF destination
DNS failure
Connection failure
404
401
429
500
Malformed JSON
Failed assertion
Oversized response
Unauthorized resource access
Expired session
```

Security tests must pass.

---

# 22. Definition of Success

The project succeeds when a company interviewer can ask:

> "What happens when you click Send?"

And the developer can confidently explain:

```text
React Request Workspace
        ↓
Next.js Server Boundary
        ↓
Authentication
        ↓
Zod Validation
        ↓
URL / Request Normalization
        ↓
SSRF Protection
        ↓
Timeout + Size Protection
        ↓
HTTP Execution
        ↓
Target API
        ↓
Bounded Response Processing
        ↓
Response Normalization
        ↓
Assertion Engine
        ↓
Prisma
        ↓
PostgreSQL
        ↓
History / Analytics
        ↓
Response Inspector
```

The developer should also be able to explain:

- Why requests execute server-side
- What CORS is
- What SSRF is
- How SSRF is mitigated
- Why runtime validation is required
- How authentication differs from authorization
- How user data is isolated
- How sensitive API credentials are protected
- How HTTP errors differ from network failures
- How assertions operate
- Why response sizes are bounded
- Why request history is retained conservatively
- How PostgreSQL data is modeled
- How Prisma migrations work
- How the application is deployed

The goal is not merely to make API Sentinel work.

The goal is to **understand why it works**.

---

# 23. Final Implementation Principle

Do not attempt to recreate Postman.

API Sentinel V1 is intentionally focused:

**Create → Configure → Send → Inspect → Assert → Save → Review**

Every implementation decision should strengthen this workflow.

When choosing between:

**more features**

and

**a more reliable core**

choose the reliable core.
