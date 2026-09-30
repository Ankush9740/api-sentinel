# API Sentinel
## Product Requirements Document — V1

**Version:** 1.0  
**Status:** Approved for planning  
**Product Type:** Developer Tool  
**Primary Goal:** Build a complete, production-quality API testing platform that can be deployed and demonstrated using real APIs.

---

# 1. Product Overview

API Sentinel is a web-based developer tool for **testing, organizing, validating, and analyzing HTTP APIs**.

A developer can enter an API endpoint, configure the HTTP request, send it through API Sentinel, inspect the response, define automated assertions, save endpoints into collections, and review previous executions.

Example:

```text
GET https://api.example.com/users/1

                    ↓

API Sentinel Server

                    ↓

Target API

                    ↓

Response

200 OK
243 ms
1.8 KB

✓ Status equals 200
✓ Response time < 500 ms
✓ body.user.id exists
```

API Sentinel should work as a real developer utility rather than a simulated API-testing interface.

---

# 2. Problem

Developers frequently need to answer questions such as:

- Is this API endpoint working?
- What response is it returning?
- How long does it take?
- Are the expected fields present?
- Did a backend change break an endpoint?
- What did the endpoint return previously?
- Are all endpoints in a feature working together?

Developers commonly test these things manually using browsers, terminal commands, temporary scripts, or API-testing applications.

API Sentinel provides a focused environment for performing and storing these checks.

---

# 3. Product Goal

The V1 product should allow a developer to:

**Configure → Send → Inspect → Validate → Save → Re-run → Compare**

API Sentinel should demonstrate real engineering concepts including:

- HTTP
- Backend development
- Authentication
- Authorization
- PostgreSQL
- ORM usage
- API integration
- Runtime validation
- Security
- Error handling
- Analytics
- Deployment

---

# 4. Target User

V1 primarily targets:

- Student developers
- Web developers
- Backend developers
- Full-stack developers
- Developers maintaining personal projects

V1 is optimized for individual developers.

Team collaboration is not required.

---

# 5. Core User Journey

```text
Sign In
   ↓
Dashboard
   ↓
Create Collection
   ↓
Create Endpoint
   ↓
Configure Request
   ↓
Send Request
   ↓
Inspect Response
   ↓
Create Assertions
   ↓
Run Assertions
   ↓
Save Endpoint
   ↓
Run Again Later
   ↓
Review History
```

The entire flow must work with a single user.

---

# 6. V1 Scope

V1 contains seven core systems:

1. Authentication
2. API Request Builder
3. Response Inspector
4. Collections & Saved Endpoints
5. Assertions
6. Execution History
7. Dashboard & Basic Analytics

A feature outside these systems should not be added unless required for their correct operation.

---

# 7. Authentication

Users must authenticate before accessing their saved API data.

V1 should support:

**GitHub authentication using Auth.js**

Additional authentication methods may be added later but are not required for initial V1.

After authentication, each user receives a private workspace.

---

# 8. Authentication Flow

```text
Landing Page
      ↓
Continue with GitHub
      ↓
GitHub OAuth
      ↓
Auth.js
      ↓
Authenticated Session
      ↓
Dashboard
```

Unauthenticated users must not access protected application pages.

---

# 9. User Data Isolation

Every user's:

- Collections
- Endpoints
- Assertions
- Request history

must belong to that user.

User A must never be able to access User B's private API configurations simply by changing a URL or request ID.

Authorization must be enforced server-side.

---

# 10. Dashboard

The dashboard provides a concise overview of the user's API testing activity.

Potential metrics:

```text
Saved Endpoints        14

Requests Run           86

Successful Requests    73

Failed Requests        13

Average Response       284 ms
```

Below this:

```text
Recent Requests

GET   /api/users          200    184ms
POST  /api/login          200    327ms
GET   /api/products       500    412ms
GET   /api/profile        401    126ms
```

Dashboard values must come from actual stored data.

Never display fake analytics.

---

# 11. Collections

Users can organize related endpoints into collections.

Example:

```text
Authentication API

├── POST /register
├── POST /login
├── GET  /profile
├── PATCH /profile
└── POST /logout
```

A collection contains:

- Name
- Optional description
- Created date
- Updated date
- Endpoints

---

# 12. Collection Operations

Users can:

- Create collection
- View collection
- Rename collection
- Edit description
- Delete collection
- Add endpoints
- Remove endpoints

Deleting a collection must require confirmation when it will remove saved data.

---

# 13. API Request Builder

The request builder is the central feature.

The user enters:

```text
Method        GET

URL
https://api.example.com/users
```

Supported V1 methods:

```text
GET
POST
PUT
PATCH
DELETE
```

HEAD and OPTIONS may be added later.

---

# 14. Request Configuration

A request may contain:

### URL

Example:

```text
https://api.example.com/users
```

### Query Parameters

Example:

```text
page       1
limit      20
sort       newest
```

### Headers

Example:

```text
Accept          application/json
Authorization   Bearer ********
```

### Request Body

For appropriate methods:

```json
{
  "email": "user@example.com",
  "name": "Example User"
}
```

JSON is the primary body format for V1.

---

# 15. Request Builder Layout

Desktop concept:

```text
┌─────────────────────────────────────────────────────┐
│ POST │ https://api.example.com/login       │ SEND  │
├─────────────────────────────────────────────────────┤
│ Params │ Headers │ Body │ Assertions               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Request configuration                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│ RESPONSE                                            │
│                                                     │
│ 200 OK       243 ms       1.4 KB                    │
│                                                     │
│ Body │ Headers │ Tests                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

The design should feel like a professional developer tool without cloning Postman.

---

# 16. Request Execution

Requests must not depend entirely on browser-side `fetch`.

Preferred flow:

```text
Browser
   ↓
API Sentinel Backend
   ↓
Validate Request
   ↓
Execute HTTP Request
   ↓
Target API
   ↓
Receive Response
   ↓
Normalize Result
   ↓
Browser
```

This avoids common browser CORS restrictions and keeps sensitive server-side processing under application control.

---

# 17. Request Execution Information

API Sentinel should measure:

- HTTP status
- Response time
- Response size
- Response headers
- Response body

Example:

```text
200 OK

243 ms

1.8 KB
```

---

# 18. Response Inspector

The response panel should support:

### Body

Pretty-print JSON when possible.

Example:

```json
{
  "id": 14,
  "name": "Example User",
  "active": true
}
```

For non-JSON responses, display safe text where appropriate.

### Headers

Example:

```text
content-type
application/json

cache-control
no-store
```

### Tests

Displays assertion results.

---

# 19. Invalid JSON

If the response claims or appears to contain JSON but parsing fails, API Sentinel should not crash.

It should display the raw safe response and indicate that JSON parsing failed.

---

# 20. Error Handling

API Sentinel should distinguish common failure types.

Examples:

```text
Request Timeout

DNS / Host Resolution Failure

Connection Refused

SSL/TLS Error

Invalid URL

Invalid Request Body

Network Failure

Response Too Large

Internal Execution Error
```

HTTP error responses such as:

```text
400
401
403
404
429
500
503
```

are still valid HTTP responses and should be displayed as such rather than being confused with API Sentinel application failures.

---

# 21. Request Timeout

Requests must have a maximum execution duration.

A target API must not be able to keep API Sentinel requests open indefinitely.

Example result:

```text
Request timed out after 10 seconds.
```

The exact V1 timeout will be defined in the Technical Specification.

---

# 22. Response Size Protection

API Sentinel must enforce a reasonable maximum response size.

This protects the application from accidentally retrieving extremely large responses.

The limit will be defined in the Technical Specification.

---

# 23. Saving Endpoints

A configured request can be saved.

Stored information may include:

- Name
- Collection
- HTTP method
- URL
- Query parameters
- Headers
- Request body
- Assertions
- Created timestamp
- Updated timestamp

---

# 24. Endpoint Example

```text
Name
Login User

Collection
Authentication API

Method
POST

URL
https://api.example.com/login

Headers
Content-Type: application/json

Body

{
  "email": "test@example.com",
  "password": "••••••••"
}
```

Sensitive values require special handling.

---

# 25. Sensitive Data

API requests may contain:

- API keys
- Bearer tokens
- Authorization headers
- Cookies
- Passwords

API Sentinel must treat these as sensitive.

Sensitive values must not:

- Appear in logs
- Appear in analytics
- Leak into client error messages
- Be exposed to other users
- Be stored carelessly as ordinary plaintext fields

The exact encryption/storage strategy will be defined in the Technical Specification.

---

# 26. Sensitive Header Display

Example:

```text
Authorization

Bearer ••••••••••••••••••
```

Users should have an intentional reveal/edit mechanism where appropriate.

---

# 27. Assertions

Users can define expectations for an API response.

Example:

```text
Status code
equals
200
```

Result:

```text
✓ Status equals 200
```

---

# 28. V1 Assertion Types

V1 should support a small, reliable assertion system.

### Status Code

```text
status equals 200
```

### Response Time

```text
response time less than 500 ms
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
header content-type exists
```

Additional assertion types may be added after V1.

---

# 29. Assertion Results

Example:

```text
Tests

✓ Status equals 200

✓ Response time < 500 ms

✓ body.user.id exists

✕ body.user.active equals true

3 / 4 passed
```

Failure should show expected and actual values when safe.

---

# 30. Assertion Execution

Assertions are evaluated against the actual HTTP response.

Conceptually:

```text
HTTP Response
      ↓
Normalize Response
      ↓
Assertion Engine
      ↓
Assertion Results
```

Assertion results must not be fabricated by the client.

---

# 31. Request History

Executed requests should create history records where appropriate.

Example:

```text
Login User

Today 10:42
200
243 ms
4 / 4 tests passed

Today 09:18
500
382 ms
1 / 4 tests passed

Yesterday 17:31
200
221 ms
4 / 4 tests passed
```

---

# 32. History Details

Selecting a historical execution may show:

- Timestamp
- Method
- URL
- Status
- Response time
- Response size
- Assertion results
- Error category if execution failed

Sensitive request values should not be unnecessarily duplicated into history.

---

# 33. History Retention

V1 does not need unlimited request history.

A reasonable retention/count limit may be used to protect free-tier database usage.

The Technical Specification will define the strategy.

---

# 34. Basic Analytics

Analytics should be derived from real request history.

Potential metrics:

### Success Rate

```text
successful requests / total requests
```

### Average Response Time

```text
sum(response times) / completed responses
```

### Failure Count

Requests producing execution failures or configured failure classifications.

### Assertion Pass Rate

```text
passed assertions / executed assertions
```

---

# 35. Endpoint Analytics

A saved endpoint may show:

```text
Login User

Last 30 Runs

Success Rate
96.7%

Average Response
241 ms

Fastest
178 ms

Slowest
612 ms

Recent Performance

▁▂▁▃▂▂▁▅▂▁
```

Analytics should remain simple in V1.

---

# 36. Search

Users should be able to search saved endpoints and collections.

Example:

```text
Search endpoints...

login
```

Results may include:

```text
POST /login
Authentication API
```

---

# 37. HTTP Method Visual Language

Methods should be easily distinguishable.

Examples:

```text
GET
POST
PUT
PATCH
DELETE
```

Use restrained semantic styling.

Do not turn the interface into a rainbow of saturated colors.

---

# 38. Landing Page

The public landing page should briefly explain the product.

Suggested structure:

```text
API Sentinel

Test APIs.
Validate responses.
Catch failures.

A focused API testing workspace for developers.

[Continue with GitHub]

────────────────────────────

Build requests

Validate responses

Save collections

Track execution history
```

The landing page should be modern but lightweight.

---

# 39. Main Application Navigation

Suggested desktop navigation:

```text
API Sentinel

Dashboard

Collections

History

────────────

Account
```

A prominent action may allow:

```text
+ New Request
```

---

# 40. Request Workspace

The request workspace is the most important screen in the product.

It should maximize useful working space.

Priority:

```text
URL + Method
      ↓
Request Configuration
      ↓
Send
      ↓
Response
      ↓
Assertions
```

Avoid unnecessary decorative dashboard elements on this page.

---

# 41. Mobile Experience

API Sentinel should remain usable on mobile for:

- Dashboard
- Collections
- History
- Viewing responses
- Basic request execution

The full request-building experience may be more comfortable on desktop.

Mobile layouts should stack request and response panels rather than shrink desktop layouts horizontally.

---

# 42. Visual Direction

API Sentinel should look:

- Modern
- Professional
- Technical
- Clean
- Attractive
- Focused
- Fast

It should feel like a serious developer product.

---

# 43. Visual Anti-Patterns

Avoid:

- Excessive purple gradients
- Neon cyberpunk UI
- Glowing cards
- Heavy glassmorphism
- Random animated backgrounds
- Giant hero text
- Excessive rounded cards
- Every section inside identical containers
- Constant animations
- Fake terminal effects used purely for decoration

Developer-focused does not automatically mean black + neon green.

---

# 44. Dark Mode

Because API Sentinel is a developer tool, dark mode is desirable.

However, dark mode must be designed properly rather than implemented as a crude color inversion.

If development budget becomes constrained, one excellent theme is preferable to two unfinished themes.

---

# 45. Loading States

Examples:

```text
Sending request...

Waiting for response...

Running assertions...
```

Longer operations should provide clear feedback.

The Send button must not allow accidental repeated execution while a request is already running unless explicitly supported.

---

# 46. Empty States

Example:

```text
No collections yet.

Create a collection to organize related API endpoints.

[Create Collection]
```

History:

```text
No requests have been run yet.

Send your first API request to start building execution history.

[New Request]
```

---

# 47. Security

Security is a major product requirement because API Sentinel interacts with arbitrary URLs and potentially sensitive credentials.

V1 must address:

- Authentication
- Authorization
- Input validation
- Sensitive-value protection
- Server-side request execution
- URL validation
- Request timeout
- Response-size limits
- Safe error messages
- Secret redaction
- SSRF protection
- Database ownership checks

---

# 48. SSRF Protection

Because API Sentinel makes server-side requests to user-provided URLs, Server-Side Request Forgery is a critical risk.

The application must prevent requests to unsafe targets such as:

- Localhost
- Loopback addresses
- Private network ranges
- Link-local addresses
- Cloud metadata endpoints
- Other internal infrastructure targets

Redirects must also be validated.

Detailed implementation belongs in the Technical Specification.

---

# 49. Validation

Runtime validation must exist for:

- URLs
- HTTP methods
- Headers
- Query parameters
- JSON bodies
- Assertions
- Collection names
- Endpoint names

TypeScript types alone are insufficient.

---

# 50. Database

API Sentinel will use PostgreSQL.

The application should store structured relational data for:

- Users/accounts where required by Auth.js
- Collections
- Saved endpoints
- Request configuration
- Assertions
- Request runs
- Assertion results

The exact schema belongs in `02-TECHNICAL-SPEC.md`.

---

# 51. ORM

Prisma will provide database access and migrations.

The project should demonstrate understanding of:

- Models
- Relations
- Constraints
- Queries
- Indexes
- Migrations

---

# 52. Authentication Technology

Auth.js will manage authentication/session functionality.

Initial provider:

**GitHub OAuth**

Authentication credentials and provider secrets must remain server-side.

---

# 53. Validation Technology

Zod should be used at important application trust boundaries.

Example:

```text
Browser
   ↓
Route Handler
   ↓
Zod Validation
   ↓
Authorization
   ↓
Business Logic
   ↓
Prisma
   ↓
PostgreSQL
```

---

# 54. Deployment

Target deployment:

```text
Application
Vercel

Database
Free PostgreSQL provider

Authentication
Auth.js + GitHub OAuth
```

The exact PostgreSQL provider will be chosen after verifying its current free-tier availability and compatibility.

---

# 55. V1 Performance Expectations

API Sentinel should feel responsive during normal application navigation.

External API execution speed depends partly on the target API and network.

The interface must distinguish:

```text
API Sentinel processing time

vs.

Target API response time
```

where relevant.

---

# 56. Accessibility

Core interfaces should support:

- Keyboard navigation
- Visible focus states
- Accessible form labels
- Sufficient contrast
- Semantic controls
- Non-color-only statuses

HTTP method/status colors must not be the only way information is communicated.

---

# 57. V1 Non-Goals

The following are explicitly NOT required for the initial version:

- Full Postman compatibility
- Team workspaces
- Real-time collaboration
- WebSocket testing
- GraphQL-specific tooling
- gRPC
- SOAP tooling
- File upload/multipart testing
- OAuth flow builder
- Environment-variable system
- Request scripting
- Pre-request scripts
- JavaScript test scripting
- CLI
- Browser extension
- Desktop application
- Public API marketplace
- AI-generated tests
- AI debugging
- Enterprise SSO
- Billing
- Subscription plans

These can be considered later.

---

# 58. Scheduled Monitoring

Automatic monitoring is a **post-core enhancement**.

Potential future flow:

```text
Saved Endpoint
      ↓
Monitor every X minutes
      ↓
Scheduled Worker
      ↓
Execute Request
      ↓
Evaluate Assertions
      ↓
Store Result
      ↓
Failure?
  │         │
 NO        YES
  │         │
Done    Create Alert
```

Do not implement this until core V1 is complete and stable.

---

# 59. Notifications

Email/webhook notifications are also optional after core completion.

Potential future events:

```text
Endpoint failed

Assertion failed

Response time exceeded threshold

Endpoint recovered
```

---

# 60. Response Comparison

Another optional enhancement:

```text
Previous Response
       ↓
Compare
       ↓
Current Response
       ↓
Detect structural differences
```

Example:

```text
Schema change detected

age

number
   ↓
string
```

This is valuable but must not delay V1 completion.

---

# 61. V1 Development Dataset

No large dataset is required.

Development can use:

```text
1 user
3 collections
10–15 endpoints
30–50 historical runs
Several assertion combinations
```

Real APIs or controlled test endpoints can be used during testing.

---

# 62. Primary V1 Screens

Target approximately:

1. Landing/Login
2. Dashboard
3. Collections
4. Collection Detail
5. Request Workspace
6. History
7. History Detail
8. Account/Settings

Supporting dialogs/forms may exist without becoming separate pages.

---

# 63. Core V1 Acceptance Flow

The following must work before API Sentinel is considered complete:

```text
Authenticate with GitHub
        ↓
Create Collection
        ↓
Create GET Request
        ↓
Send to Real API
        ↓
Receive Real Response
        ↓
View Status + Time + Body + Headers
        ↓
Create Assertions
        ↓
Run Again
        ↓
See Assertion Results
        ↓
Save Endpoint
        ↓
Create POST Request
        ↓
Send JSON Body
        ↓
View Response
        ↓
Open History
        ↓
View Previous Run
        ↓
Dashboard Reflects Real Activity
```

---

# 64. Failure Acceptance Flow

The application must also successfully handle:

```text
Invalid URL

Timeout

404

401

429

500

Malformed JSON

Unreachable host

Failed assertion

Unauthorized database resource access

Expired authentication session
```

A project that works only when APIs return `200 OK` is not complete.

---

# 65. Product Success Criteria

API Sentinel V1 succeeds when:

- A developer can authenticate.
- Users have isolated private workspaces.
- Collections can organize API endpoints.
- Real HTTP requests can be executed.
- GET/POST/PUT/PATCH/DELETE work.
- Query parameters work.
- Custom headers work.
- JSON request bodies work.
- Responses are displayed correctly.
- Response time is measured.
- Response size is measured.
- Assertions operate on real responses.
- Endpoints can be saved.
- Previous executions can be inspected.
- Dashboard analytics derive from actual data.
- Common network/API errors are handled cleanly.
- Sensitive values are protected appropriately.
- SSRF protections exist.
- Desktop experience is polished.
- Mobile experience is usable.
- Production deployment works.
- TypeScript, lint, tests, and production build pass.

---

# 66. Definition of Done

API Sentinel is NOT complete because:

- Pages look attractive.
- Mock API responses appear.
- Authentication UI exists without authentication.
- Dashboard contains placeholder statistics.
- Buttons animate.
- Database models exist without complete flows.

API Sentinel is complete when the full workflow operates against **real APIs with real persisted data**.

---

# 67. Portfolio Demonstration

A portfolio demonstration should be possible in a few minutes.

Example:

```text
1. Sign in.

2. Open "Demo APIs".

3. Select GET /users.

4. Send request.

5. Show:
   200 OK
   response time
   response JSON

6. Show assertions.

7. Intentionally create a failing assertion.

8. Run again.

9. Show failed test.

10. Open History.

11. Show previous executions.

12. Open Dashboard.

13. Explain how results are stored and analyzed.
```

This demonstrates both the product and the engineering behind it.

---

# 68. Interview Explanation Goal

The developer who builds API Sentinel should be able to explain:

- What happens when Send is clicked.
- Why requests execute server-side.
- What CORS is.
- How HTTP methods differ.
- How status codes are handled.
- How response time is measured.
- How assertions work.
- How Auth.js sessions work.
- How PostgreSQL data is modeled.
- Why Prisma is used.
- Why runtime validation is necessary.
- How users are prevented from accessing each other's records.
- How API credentials are protected.
- What SSRF is and how the application mitigates it.
- How timeouts work.
- How network failures differ from HTTP error responses.
- How the application is deployed.

The project should be understandable by its creator from end to end.

---

# 69. Scope Rule

During implementation, when considering a new feature, ask:

> Is this necessary to make the core API testing workflow complete?

If **yes**, implement it.

If **no**, record it as a future enhancement.

Do not sacrifice completion for feature count.

---

# 70. Final Product Principle

API Sentinel should not attempt to become Postman.

Its goal is to be a **focused, secure, polished API testing application** demonstrating strong full-stack engineering.

The V1 experience should be:

**Create → Configure → Send → Inspect → Assert → Save → Review**

Every feature should strengthen that workflow.