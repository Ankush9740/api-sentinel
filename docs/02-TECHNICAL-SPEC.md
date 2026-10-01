# API Sentinel
## Technical Specification — V1

**Version:** 1.0  
**Related Document:** `01-PRD.md`

---

# 1. Technical Objective

API Sentinel will be a production-quality full-stack developer tool capable of executing real HTTP requests, validating responses, persisting request configurations and execution history, and securely isolating user data.

The architecture must remain:

- Secure
- Understandable
- Deployable
- Maintainable
- Appropriate for the free-tier environment
- Small enough to complete within the V1 development budget

Avoid unnecessary infrastructure.

---

# 2. Final V1 Stack

## Application

- Next.js
- React
- TypeScript
- Tailwind CSS

## Database

- PostgreSQL
- Neon

## ORM

- Prisma ORM

## Authentication

- Auth.js
- GitHub OAuth

## Validation

- Zod

## Deployment

- Vercel

## Testing

- Unit tests for important business/security logic
- Integration tests where practical

No Supabase will be used.

---

# 3. High-Level Architecture

```text
                    Browser
                       │
                       ▼
              Next.js Application
              ┌─────────────────┐
              │ React UI        │
              │ Server Logic    │
              │ Route Handlers  │
              │ Auth.js         │
              │ Zod Validation  │
              └────────┬────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
      Prisma ORM             Request Executor
          │                         │
          ▼                         ▼
     Neon PostgreSQL           Target API
```

The browser never connects directly to PostgreSQL.

Target API requests are executed server-side.

---

# 4. Runtime

API request execution should use a **Node.js server runtime**, not rely on browser-side requests.

This provides:

- Better control over request execution
- Timeout enforcement
- SSRF protection
- Secret handling
- Response-size protection
- Consistent error normalization

---

# 5. Project Structure

Recommended structure:

```text
api-sentinel/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (app)/
│   │   └── api/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── request/
│   │   ├── response/
│   │   ├── collections/
│   │   └── dashboard/
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── request-executor/
│   │   ├── assertions/
│   │   ├── encryption/
│   │   ├── security/
│   │   └── validation/
│   │
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│
├── docs/
│   ├── 01-PRD.md
│   ├── 02-TECHNICAL-SPEC.md
│   └── 03-IMPLEMENTATION-PLAN.md
│
└── public/
```

The exact structure may change when technically justified.

---

# 6. Authentication

Auth.js will manage authentication.

Initial provider:

```text
GitHub OAuth
```

Flow:

```text
User
 ↓
Continue with GitHub
 ↓
GitHub
 ↓
OAuth callback
 ↓
Auth.js
 ↓
Session
 ↓
API Sentinel
```

Auth.js is responsible for authentication.

Application authorization remains API Sentinel's responsibility.

---

# 7. User Identity

Each application user receives a stable database identity.

Conceptually:

```text
User

id
name
email
image
createdAt
updatedAt
```

Auth.js-required account/session models will be added according to the adapter architecture selected during implementation.

---

# 8. Authorization

Every user-owned operation must verify ownership server-side.

Example:

```text
GET /api/endpoints/abc123
```

must NOT perform:

```text
find endpoint where id = abc123
```

alone.

Conceptually it must ensure:

```text
endpoint.id = abc123

AND

endpoint.userId = authenticatedUser.id
```

or establish ownership through the endpoint's collection.

Changing an ID in a URL must never expose another user's records.

---

# 9. Database Domain Model

Primary application entities:

```text
User
 │
 └── Collection
       │
       └── Endpoint
             │
             ├── RequestHeader
             ├── QueryParameter
             ├── Assertion
             └── RequestRun
                    │
                    └── AssertionResult
```

---

# 10. Collection

Conceptual model:

```text
Collection

id
userId
name
description?
createdAt
updatedAt
```

Relationship:

```text
User 1 ────── * Collection
```

Indexes should support retrieval by user.

---

# 11. Endpoint

Conceptual model:

```text
Endpoint

id
collectionId
name
method
url
body?
createdAt
updatedAt
```

HTTP method should use a constrained enum.

V1:

```text
GET
POST
PUT
PATCH
DELETE
```

---

# 12. Request Headers

Headers should not be stored as one uncontrolled text blob.

Conceptual model:

```text
RequestHeader

id
endpointId
key
value
enabled
sensitive
createdAt
updatedAt
```

Sensitive values require encryption.

---

# 13. Query Parameters

Conceptual model:

```text
QueryParameter

id
endpointId
key
value
enabled
createdAt
updatedAt
```

Disabled parameters remain editable but are not sent.

---

# 14. Request Body

V1 primarily supports JSON bodies.

The endpoint may store the body as text or validated structured JSON depending on implementation requirements.

The editor must preserve user formatting where practical.

Invalid JSON must be identified before request execution when JSON mode is selected.

---

# 15. Assertions

Conceptual model:

```text
Assertion

id
endpointId
type
operator
target?
expectedValue?
enabled
createdAt
updatedAt
```

Supported types:

```text
STATUS_CODE
RESPONSE_TIME
JSON_PATH
HEADER
```

Supported operators depend on assertion type.

Examples:

```text
EQUALS
LESS_THAN
EXISTS
```

Do not create a generic arbitrary-code assertion engine in V1.

---

# 16. Request Runs

Each persisted execution contains metadata.

Conceptual model:

```text
RequestRun

id
endpointId?
userId

method
url

statusCode?
durationMs?
responseSizeBytes?

responseContentType?
responseBody?

executionStatus

errorCode?
errorMessage?

createdAt
```

A request may be executed before it is permanently saved as an endpoint.

Therefore `endpointId` may be nullable if V1 supports unsaved-request history.

---

# 17. Execution Status

Normalize execution into categories such as:

```text
SUCCESS
HTTP_RESPONSE
TIMEOUT
DNS_ERROR
CONNECTION_ERROR
TLS_ERROR
INVALID_REQUEST
RESPONSE_TOO_LARGE
BLOCKED_TARGET
INTERNAL_ERROR
```

A `500` response from the target API is still an HTTP response.

It is not the same as API Sentinel suffering an internal server error.

---

# 18. Assertion Results

Conceptual model:

```text
AssertionResult

id
requestRunId
assertionId?
type
passed
expected?
actual?
message?
createdAt
```

Historical results should remain understandable even if an assertion is later edited.

Therefore enough assertion information should be snapshotted into the result.

---

# 19. Database Integrity

Use:

- Foreign keys
- Cascading behavior only where intentional
- Unique constraints where appropriate
- Enums/checks
- Indexes
- Required fields

Do not rely entirely on application code to preserve relational integrity.

---

# 20. Database Indexes

Likely useful indexes:

```text
Collection(userId)

Endpoint(collectionId)

RequestRun(userId, createdAt)

RequestRun(endpointId, createdAt)

Assertion(endpointId)
```

Final indexes should reflect actual queries.

---

# 21. Database Provider

Neon PostgreSQL is the preferred V1 provider.

Use serverless-compatible connection handling appropriate for Vercel.

Do not open uncontrolled PostgreSQL connections per request.

---

# 22. Prisma

Prisma handles:

- Schema
- Migrations
- Queries
- Relations
- Type-safe database access

Database changes must use migrations.

Do not manually modify production schema and leave Prisma unaware.

---

# 23. Request Execution Pipeline

This is the most important backend flow.

```text
Browser
   │
   ▼
POST execution request
   │
   ▼
Authenticate User
   │
   ▼
Zod Validation
   │
   ▼
Normalize Request
   │
   ▼
Security Validation
   │
   ▼
SSRF Protection
   │
   ▼
Apply Timeout
   │
   ▼
Execute HTTP Request
   │
   ▼
Read Bounded Response
   │
   ▼
Measure Duration + Size
   │
   ▼
Normalize Response
   │
   ▼
Run Assertions
   │
   ▼
Persist Run
   │
   ▼
Return Safe Result
```

Each stage should have a clear responsibility.

---

# 24. Request Validation

Validate before execution:

- HTTP method
- URL
- protocol
- headers
- query parameters
- body
- assertion definitions

Only:

```text
http:
https:
```

may be supported.

Reject protocols such as:

```text
file:
ftp:
data:
javascript:
```

---

# 25. SSRF Threat

API Sentinel accepts arbitrary URLs and performs server-side HTTP requests.

Therefore this is dangerous:

```text
http://localhost:...
```

as are requests targeting internal infrastructure.

An attacker could otherwise use API Sentinel's server as a network proxy.

SSRF protection is mandatory.

---

# 26. SSRF Protection

Before execution:

1. Parse URL.
2. Require HTTP/HTTPS.
3. Reject malformed hostnames.
4. Resolve hostname.
5. Inspect resolved IP addresses.
6. Reject prohibited address ranges.
7. Execute only after validation.

Block at minimum:

```text
localhost

127.0.0.0/8

::1

private IPv4 ranges

10.0.0.0/8

172.16.0.0/12

192.168.0.0/16

link-local addresses

169.254.0.0/16

IPv6 private/link-local equivalents

cloud metadata destinations
```

Security logic should use tested IP parsing rather than naive string-prefix checks.

---

# 27. Redirect Security

A safe public URL could redirect to:

```text
http://127.0.0.1
```

Therefore automatic redirects must not bypass SSRF validation.

Preferred design:

```text
Request
   ↓
Response redirect?
   │
  YES
   ↓
Validate destination again
   ↓
Follow only if safe
```

Set a small redirect limit.

Example:

```text
Maximum redirects: 5
```

---

# 28. DNS Rebinding Considerations

SSRF defenses should not assume hostname validation alone is sufficient.

Resolved destinations must be checked carefully.

The implementation should minimize the gap between validation and connection and use a security approach appropriate to the runtime.

This area should receive dedicated tests.

---

# 29. Request Timeout

Initial V1 target:

```text
10 seconds
```

Use an abort mechanism such as `AbortController`.

A timeout should produce a normalized result rather than a generic 500.

Example:

```text
TIMEOUT

Target API did not respond within 10 seconds.
```

---

# 30. Response Size Limit

Initial V1 maximum:

```text
4 MiB (4,194,304 bytes)
```

The response should be read in a bounded manner where feasible.

If the response exceeds the configured maximum:

```text
RESPONSE_TOO_LARGE
```

Do not continue loading arbitrarily large content into memory.

---

# 31. Request Body Limit

V1 request body should also have a reasonable maximum.

Initial target:

```text
1 MB
```

This is more than sufficient for the intended JSON API testing use case.

---

# 32. Header Limits

Apply reasonable limits to:

- Header count
- Header key length
- Header value length

This protects the executor from abusive or accidental extreme input.

Exact values may be centralized in configuration.

---

# 33. Unsupported Headers

Certain hop-by-hop or dangerous headers may need to be controlled rather than blindly forwarded.

The request executor should explicitly define header behavior.

Do not blindly trust every user-supplied transport-level header.

---

# 34. User-Agent

API Sentinel should identify itself using a reasonable User-Agent where possible.

Example concept:

```text
API-Sentinel/1.0
```

Do not impersonate browsers unnecessarily.

---

# 35. Measuring Response Time

Measure server-side around the actual outbound request.

Use an appropriate monotonic/high-resolution timer.

Conceptually:

```text
start
 ↓
HTTP request
 ↓
response received
 ↓
end

duration = end - start
```

Document precisely whether the metric represents time-to-headers or full-body completion.

For V1, use one consistent definition.

---

# 36. Response Size

Calculate from the actual response bytes read rather than trusting `Content-Length` alone.

Servers may:

- omit it
- compress data
- provide incorrect values

The metric should be defined consistently.

---

# 37. Response Body Storage

Do NOT automatically store unlimited response bodies forever.

For V1:

- Store bounded response content where useful.
- Respect the global response-size limit.
- Consider a smaller persistence limit than the execution limit.

Example strategy:

```text
Execution maximum: 4 MiB (4,194,304 bytes)

Persisted body maximum:
256 KB
```

Large responses may retain metadata while truncating or omitting persisted body content.

This protects the free database tier.

---

# 38. History Retention

V1 should avoid unbounded database growth.

Possible policy:

```text
Maximum 100 recent runs per endpoint
```

or another similarly conservative limit.

Old runs can be removed when the limit is exceeded.

The exact implementation should remain centralized and documented.

---

# 39. Sensitive Values

Sensitive request values include:

- Authorization headers
- API keys
- Cookies
- Password-like custom headers

Sensitive values stored for saved endpoints must be encrypted at rest at the application level.

---

# 40. Encryption Strategy

Use authenticated encryption.

Preferred conceptual approach:

```text
AES-256-GCM
```

Server environment variable:

```text
ENCRYPTION_KEY
```

Flow:

```text
Plain Secret
    ↓
Server
    ↓
Encrypt
    ↓
Ciphertext + IV + Auth Tag
    ↓
Database
```

Decrypt only server-side when executing the saved request.

Never send encryption keys to the browser.

---

# 41. Encryption Key

The encryption key must:

- Be cryptographically random
- Remain server-only
- Not be committed to Git
- Be stored in deployment environment variables

If the key is lost, encrypted stored secrets may become unrecoverable.

This is acceptable for V1 and should be documented.

---

# 42. Secret Redaction

Logs must redact sensitive headers.

Bad:

```text
Authorization: Bearer ghp_123456789...
```

Good:

```text
Authorization: [REDACTED]
```

Do not log complete request bodies by default because they may contain credentials.

---

# 43. Passwords in Request Bodies

API Sentinel cannot reliably infer every sensitive JSON field.

The product should warn users that saved request bodies may contain sensitive values.

A future environment-variable/secret-variable system can improve this.

V1 should avoid pretending it can automatically secure arbitrary secrets embedded inside JSON.

---

# 44. Assertion Engine

Assertions must use predefined structured operations.

Do NOT evaluate arbitrary JavaScript.

Example:

```text
{
  type: "STATUS_CODE",
  operator: "EQUALS",
  expected: "200"
}
```

Server:

```text
evaluateAssertion(response, assertion)
```

Result:

```text
passed: true
expected: 200
actual: 200
```

---

# 45. JSON Path Assertions

V1 should support simple property paths.

Example:

```text
user.id
```

Nested traversal:

```text
body.user.id
```

Avoid implementing a complete expression language unless necessary.

The supported syntax must be documented.

---

# 46. Assertion Safety

Assertion evaluation must never:

- Execute user JavaScript
- Use `eval`
- Dynamically execute expressions
- Access server environment variables
- Access unrelated request data

Assertions operate only on normalized response data.

---

# 47. Analytics

Analytics are calculated from `RequestRun` and `AssertionResult`.

Examples:

```text
Total Requests

HTTP Success Count

Execution Failure Count

Average Response Time

Assertion Pass Rate
```

Define "success" clearly.

For example:

```text
HTTP success:
status 200–299
```

But display actual status codes rather than hiding non-2xx responses behind a generic failure label.

---

# 48. API Routes / Server Actions

Use server-side mechanisms appropriate to each operation.

Possible API routes:

```text
/api/collections

/api/collections/[id]

/api/endpoints

/api/endpoints/[id]

/api/execute

/api/history

/api/history/[id]
```

Exact routing may change during implementation.

Execution should have a dedicated backend boundary.

---

# 49. API Error Shape

Use a consistent application error structure.

Example:

```json
{
  "error": {
    "code": "BLOCKED_TARGET",
    "message": "Requests to private network addresses are not allowed."
  }
}
```

Do not expose internal stack traces in production.

---

# 50. HTTP Response vs Application Error

Important distinction:

Target API:

```text
HTTP 500
```

API Sentinel should return a successful execution result containing:

```text
targetStatus: 500
```

API Sentinel internal failure:

```text
INTERNAL_ERROR
```

These must not be conflated.

---

# 51. Zod Validation

Zod schemas should cover:

- Collection creation/update
- Endpoint creation/update
- Request execution
- Headers
- Query parameters
- Request body metadata
- Assertions

Client validation improves UX.

Server validation provides security.

Server validation remains authoritative.

---

# 52. URL Handling

Do not build request URLs through naive string concatenation.

Use standard URL APIs.

Query parameters should be applied safely using URL/search-parameter APIs.

---

# 53. Authentication Protection

Protected server operations should retrieve the authenticated session server-side.

Do not trust:

```text
userId
```

provided by the browser.

The user ID comes from the authenticated server session.

---

# 54. CSRF / OAuth Security

Use Auth.js-supported mechanisms and secure defaults.

Do not manually recreate OAuth security.

Production cookies should use appropriate secure settings.

---

# 55. GitHub OAuth

Required environment variables will include provider credentials according to current Auth.js configuration.

GitHub OAuth callback URLs must be configured for:

- Local development
- Production

Do not commit GitHub client secrets.

---

# 56. Environment Variables

Expected categories:

```text
DATABASE_URL

AUTH_SECRET

AUTH_GITHUB_ID
AUTH_GITHUB_SECRET

ENCRYPTION_KEY

NEXT_PUBLIC_APP_URL
```

Exact Auth.js names should follow the version actually installed.

Create:

```text
.env.example
```

containing placeholders only.

---

# 57. Git Ignore

At minimum:

```text
.env
.env.local
.env*.local
```

Real secrets must never be committed.

Before push, inspect staged files.

---

# 58. UI Architecture

Server Components should handle data-heavy initial page rendering where appropriate.

Client Components should be limited to interactive areas such as:

- Request editor
- Tabs
- JSON editor
- Assertion builder
- Charts
- Dialogs

Do not make the entire application client-rendered without reason.

---

# 59. Request Editor State

The active request editor will contain temporary client state.

Example:

```text
method
url
headers
params
body
assertions
```

This state becomes persistent only when:

```text
Save
```

is performed.

Executing a request should not unexpectedly overwrite saved endpoint configuration unless intentionally designed.

---

# 60. Unsaved Changes

If a user edits a saved endpoint and attempts to leave before saving, the UI should avoid silent data loss.

Use a reasonable dirty-state strategy.

Do not overcomplicate browser navigation interception if it becomes unreliable.

---

# 61. JSON Editor

V1 does not require Monaco.

A lightweight code-style textarea/editor is sufficient for JSON request bodies and response display.

This reduces bundle size and development complexity.

Use syntax highlighting only if it can be added cheaply and reliably.

---

# 62. Response Rendering

Response content must be displayed as text/data.

Do NOT render arbitrary returned HTML directly into the application DOM.

This prevents target APIs from injecting active content.

---

# 63. XSS

Never use unsanitized response bodies with:

```text
dangerouslySetInnerHTML
```

JSON/text responses should be escaped by React's normal rendering.

---

# 64. CORS

Because outbound requests execute from the API Sentinel server, browser CORS restrictions generally do not apply to the target API request in the same way they would for direct browser requests.

However, the target server can still reject requests for its own reasons.

The project documentation should explain this distinction.

---

# 65. Rate Limiting

The execution endpoint can be abused as an HTTP request proxy.

Therefore rate limiting is strongly recommended.

Initial policy can be conservative.

Example concept:

```text
Authenticated user:
60 executions / minute
```

The exact mechanism/provider should be selected during implementation based on free-tier availability.

If external infrastructure is avoided initially, basic application-level protection may be used for development, but production limitations must be documented.

---

# 66. Request Concurrency

Prevent accidental request storms.

The UI should disable or appropriately control repeated Send actions while one execution is active.

The server should remain safe against parallel requests regardless of UI behavior.

---

# 67. Logging

Log useful application events:

- Internal execution failures
- Database failures
- Authentication failures where appropriate
- Security-blocked destinations

Never log:

- API tokens
- Authorization values
- Cookies
- Encryption keys
- OAuth secrets
- Complete sensitive bodies

---

# 68. Tests — High Priority

Security and business logic tests should focus on:

### SSRF

```text
localhost → blocked
127.0.0.1 → blocked
10.x.x.x → blocked
192.168.x.x → blocked
public HTTPS URL → allowed
unsafe redirect → blocked
```

### Assertions

```text
status equals
response time less than
JSON property exists
JSON value equals
header exists
```

### Authorization

```text
User A resource → User A allowed

User A resource → User B denied
```

### Encryption

```text
encrypt → ciphertext differs

decrypt → original value

tampered ciphertext → rejected
```

---

# 69. Request Executor Tests

Test:

- GET
- POST JSON
- PUT
- PATCH
- DELETE
- Query parameters
- Headers
- Timeout
- Non-JSON response
- Malformed JSON response
- HTTP 404
- HTTP 500
- Oversized response

Use controlled test servers/mocks where practical.

---

# 70. Database Testing

Verify:

- Collection ownership
- Endpoint relationships
- Cascade/archive behavior
- History creation
- Assertion result creation
- History retention logic

---

# 71. Performance

Avoid premature optimization.

Primary V1 concerns:

- Avoid unnecessary client JavaScript
- Paginate history
- Limit response persistence
- Index frequent queries
- Use serverless-compatible DB connection handling
- Avoid loading complete histories for dashboard metrics

---

# 72. Pagination

History should be paginated.

Collections/endpoints may initially be small, but the architecture should not assume unlimited records can always be loaded at once.

---

# 73. Dashboard Queries

Dashboard should retrieve aggregates efficiently.

Avoid:

```text
load every RequestRun
→ calculate everything in browser
```

Prefer database/server aggregation.

---

# 74. Deployment Architecture

```text
GitHub Repository
       │
       ▼
     Vercel
       │
       ├──────────────► Neon PostgreSQL
       │
       ├──────────────► GitHub OAuth
       │
       └──────────────► Target APIs
```

Vercel environment variables store production secrets.

---

# 75. Database Migrations

Production deployment should apply migrations deliberately.

Do not use development-only schema reset commands against production.

Prisma deployment practices should follow the installed Prisma version.

---

# 76. Preview Deployments

Be cautious about preview deployments using the production database.

If preview deployments are used extensively, consider a separate preview database/branch.

V1 can initially keep deployment workflow simple.

---

# 77. Free-Tier Awareness

API Sentinel should be designed conservatively for free infrastructure.

Control:

- Database history growth
- Stored response sizes
- Execution frequency
- Build/deployment complexity
- External service usage

Do not design V1 assuming unlimited resources.

---

# 78. Graceful Failure

Examples:

### Database unavailable

```text
We couldn't load your workspace right now.

Try again shortly.
```

### Target unavailable

```text
Connection failed.

The target server could not be reached.
```

### Authentication expired

```text
Your session has expired.

Sign in again to continue.
```

### Security block

```text
Request blocked.

API Sentinel does not allow requests to private or internal network addresses.
```

---

# 79. Security Priority

For API Sentinel, security takes priority over convenience.

If a feature requires weakening SSRF protection or secret handling merely to support an edge case, the feature should be excluded from V1.

---

# 80. Implementation Priorities

Engineering priority:

```text
1. Correctness

2. Security

3. Complete core workflow

4. Reliability

5. User experience

6. Performance

7. Additional features
```

---

# 81. Technical Definition of Done

V1 is technically complete when:

- GitHub authentication works.
- PostgreSQL persistence works.
- Prisma migrations are reproducible.
- Users cannot access each other's records.
- Collections work.
- Saved endpoints work.
- All five V1 HTTP methods work.
- Query parameters work.
- Headers work.
- JSON bodies work.
- Real HTTP execution works.
- SSRF protections work.
- Redirect validation works.
- Timeouts work.
- Response-size protection works.
- Response inspection works.
- Assertions work.
- History works.
- Analytics work.
- Sensitive saved headers are encrypted.
- Logs redact secrets.
- Error states are meaningful.
- Desktop UI is polished.
- Mobile UI is usable.
- Tests cover important security/business logic.
- TypeScript passes.
- Lint passes.
- Production build passes.
- Production deployment works.

---

# 82. Architecture Rule for Codex

Codex must not replace this architecture with a different backend platform or simplify security-critical requirements merely to complete implementation faster.

In particular, do not silently:

- Replace PostgreSQL with local storage.
- Replace Auth.js with fake authentication.
- Execute all target requests directly from the browser.
- Remove SSRF protection.
- Store sensitive headers unencrypted.
- Use mock response data instead of real HTTP execution.
- Remove authorization checks.
- Introduce arbitrary JavaScript assertions.
- Replace real analytics with placeholder numbers.

If a technical requirement cannot be implemented as specified, report the blocker before changing architecture.

---

# 83. Scope Protection

If implementation becomes expensive, remove optional polish before removing core engineering.

Remove in this order if necessary:

```text
Advanced charts
↓
Secondary animations
↓
Complex search/filtering
↓
Minor dashboard metrics
```

Do NOT remove:

```text
Authentication
Database
Authorization
Request execution
SSRF protection
Assertions
History
Security
```

---

# 84. Final Architecture

```text
                     USER
                       │
                       ▼
               Next.js / React
                       │
                       ▼
                Authenticated
                Server Boundary
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Application Data          Request Executor
          │                         │
          ▼                         ▼
       Prisma                Security Layer
          │                         │
          ▼                         ▼
   Neon PostgreSQL              Internet
                                    │
                                    ▼
                               Target API
                                    │
                                    ▼
                            Normalized Response
                                    │
                                    ▼
                             Assertion Engine
                                    │
                                    ▼
                                History
```

API Sentinel should remain a relatively small application with unusually strong implementation quality.

The project's technical value comes from correctly handling **HTTP, security, authentication, authorization, persistence and failure conditions**, not from having a huge feature list.
