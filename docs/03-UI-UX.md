# API Sentinel
## UI/UX Specification — V1

**Version:** 1.0  
**Document:** `03-UI-UX.md`  
**Related:** `01-PRD.md`, `02-TECHNICAL-SPEC.md`

---

# 1. Design Objective

API Sentinel should feel like a **real developer product**, not a college-project dashboard.

The interface must be:

- Modern
- Professional
- Technical
- Attractive
- Fast
- Dense where useful
- Easy to understand
- Consistent
- Responsive

The primary design principle is:

> **The API request and response are the focus. The interface stays out of the way.**

---

# 2. Product Personality

API Sentinel should communicate:

**Precision + reliability + control**

It should NOT communicate:

- Gaming
- Cyberpunk
- AI chatbot
- Cryptocurrency
- Marketing landing-page template
- Generic admin dashboard

Think:

```text id="szp0v2"
Developer workspace
+
Professional SaaS
+
Technical precision
```

---

# 3. Visual Direction

Prefer:

- Neutral backgrounds
- Strong typography
- Subtle borders
- Restrained shadows
- Compact controls
- Clear hierarchy
- Monospace where technically useful
- Small amounts of semantic color
- Generous workspace area

Avoid excessive decoration.

---

# 4. Theme

V1 should prioritize an excellent **dark developer-tool interface**.

A possible light theme can be added later if inexpensive.

Do not compromise the dark theme merely to support two mediocre themes.

---

# 5. Color Philosophy

The application should primarily use:

```text id="vl8h6v"
Background
Surface
Elevated Surface
Border
Primary Text
Secondary Text
Muted Text
Accent
```

Semantic colors are reserved for:

```text id="g6fdld"
Success
Warning
Danger
HTTP methods
```

Do not make every card a different color.

Do not use excessive gradients.

---

# 6. Accent

Use one restrained product accent.

It may appear in:

- Primary buttons
- Active navigation
- Focus rings
- Selected tabs
- Important interactive states

It should not cover large portions of the screen.

---

# 7. HTTP Method Language

HTTP methods should be quickly recognizable.

Examples:

```text id="fnkno7"
GET
POST
PUT
PATCH
DELETE
```

Each may use restrained semantic differentiation.

However, always show the method text.

Color must never be the only identifier.

---

# 8. Status Language

Responses should clearly distinguish:

```text id="gxgx3f"
2xx → success

3xx → redirect

4xx → client response

5xx → server response
```

Example:

```text id="i42z4s"
200 OK
404 Not Found
500 Internal Server Error
```

Do not reduce responses to generic green/red dots.

---

# 9. Typography

Use a clean sans-serif for interface text.

Use monospace selectively for:

- URLs
- JSON
- Headers
- HTTP methods where appropriate
- Status information
- Technical values

Avoid using monospace for every piece of UI text.

---

# 10. Hierarchy

A user should immediately recognize:

1. Current workspace/page
2. Request being edited
3. Primary action
4. Response
5. Supporting controls

Avoid multiple elements competing for visual dominance.

---

# 11. Application Shell

Desktop structure:

```text id="uwqk81"
┌─────────────┬────────────────────────────────────────────┐
│             │                                            │
│ API         │              Main Workspace                │
│ Sentinel    │                                            │
│             │                                            │
│ Dashboard   │                                            │
│ Collections │                                            │
│ History     │                                            │
│             │                                            │
│─────────────│                                            │
│ Account     │                                            │
└─────────────┴────────────────────────────────────────────┘
```

Sidebar should remain relatively narrow.

The workspace receives most of the screen.

---

# 12. Sidebar

Recommended contents:

```text id="oy4m8b"
API Sentinel

Dashboard
Collections
History

────────────

+ New Request

────────────

User
```

Do not overload navigation.

V1 does not need dozens of sections.

---

# 13. Sidebar Behaviour

Desktop:

Persistent sidebar.

Tablet:

Compact/collapsible if needed.

Mobile:

Drawer or compact navigation.

The mobile sidebar must not permanently consume valuable horizontal space.

---

# 14. Landing Page

The landing page should be short.

Suggested structure:

```text id="6pqh25"
API SENTINEL

Test APIs.
Validate responses.
Catch failures.

A focused API testing workspace
built for developers.

[ Continue with GitHub ]

────────────────────────────

Build Requests
Configure methods, headers, parameters and JSON.

Validate Responses
Create assertions against real API responses.

Track Runs
Review request history and performance.
```

No massive marketing site is required.

---

# 15. Landing Visual

A lightweight request/response preview can demonstrate the product.

Example:

```text id="5d0vrs"
GET   api.example.com/users        SEND

200 OK    184 ms

{
  "users": [...]
}

✓ status = 200
✓ response < 500 ms
```

Do not spend significant development budget on landing-page animations.

---

# 16. Dashboard

Dashboard should answer:

> What has happened in my API workspace recently?

Suggested layout:

```text id="c7upg4"
Dashboard

Good morning, Developer

┌─────────────┬─────────────┬─────────────┐
│ Endpoints   │ Requests    │ Avg Response│
│     14      │     86      │    284ms    │
└─────────────┴─────────────┴─────────────┘

Recent Requests
────────────────────────────────────────────

GET   /users          200       184ms
POST  /login          200       327ms
GET   /products       500       412ms
GET   /profile        401       126ms
```

Metrics should remain compact.

---

# 17. Dashboard Cards

Metric cards should not become giant decorative blocks.

They exist to communicate information.

Use:

- Small label
- Strong value
- Optional concise context

Avoid:

- Huge icons
- Decorative gradients
- Excessive shadows
- Animated numbers everywhere

---

# 18. Dashboard Empty State

New user:

```text id="ed3uvz"
Your API workspace is empty.

Create your first collection or send
a request to get started.

[ New Request ]   [ Create Collection ]
```

Do not display fake metrics.

---

# 19. Collections Page

Suggested layout:

```text id="bnzihf"
Collections                           [+ New Collection]

Organize related API endpoints.

────────────────────────────────────────────────────

Authentication API
5 endpoints
Updated 12 min ago

Users API
8 endpoints
Updated yesterday

Payments
4 endpoints
Updated Sep 29
```

Avoid oversized cards.

Rows or compact panels are preferable.

---

# 20. Collection Detail

Example:

```text id="8bh8j7"
← Collections

Authentication API
Endpoints for authentication workflows.

[ Edit ]                            [+ Endpoint]

────────────────────────────────────────────────────

POST     Register User
         /api/register

POST     Login User
         /api/login

GET      Current User
         /api/profile

PATCH    Update Profile
         /api/profile

POST     Logout
         /api/logout
```

Endpoint rows should be easy to scan.

---

# 21. Request Workspace

This is the most important screen.

It receives the greatest design attention.

Desktop:

```text id="wqlj7j"
┌────────────┬─────────────────────────────────────────────────────┐
│            │ Login User                                         │
│            │                                                     │
│            │ POST │ https://api.example.com/login │    SEND →   │
│            │                                                     │
│ Navigation ├─────────────────────────────────────────────────────┤
│            │ Params    Headers    Body    Assertions             │
│            │ ─────────────────────────────────────────────────── │
│            │                                                     │
│            │ {                                                   │
│            │   "email": "user@example.com",                      │
│            │   "password": "••••••••"                            │
│            │ }                                                   │
│            │                                                     │
│            ├─────────────────────────────────────────────────────┤
│            │ RESPONSE                         200   243ms   1.4KB│
│            │                                                     │
│            │ Body         Headers         Tests                  │
│            │ ─────────────────────────────────────────────────── │
│            │                                                     │
│            │ {                                                   │
│            │   "success": true,                                  │
│            │   "user": { ... }                                   │
│            │ }                                                   │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

The user should be able to understand the workflow without instructions.

---

# 22. Request Top Bar

Primary sequence:

```text id="qgppoh"
[METHOD] [                URL                 ] [SEND]
```

Example:

```text id="xbslv2"
[ POST ▼ ] [ https://api.example.com/login ] [ Send → ]
```

The URL field receives most horizontal space.

The Send button should be immediately obvious.

---

# 23. Send Button States

Default:

```text id="ykim0i"
Send →
```

Executing:

```text id="2lg3gg"
Sending...
```

The button should be disabled appropriately during an active execution.

Success should be communicated primarily through the response panel, not through a distracting button animation.

---

# 24. Request Tabs

Use:

```text id="5abg1r"
Params
Headers
Body
Assertions
```

Optional counts can help:

```text id="kvgnq3"
Params 2
Headers 3
Assertions 4
```

The active tab should be clear without using a huge filled container.

---

# 25. Query Parameters

Use editable rows:

```text id="t8j8ax"
✓  KEY              VALUE

   page             1
   limit            20
   sort             newest
```

Each row should support:

- Enabled/disabled
- Key
- Value
- Remove

A blank row may appear automatically for fast entry.

---

# 26. Headers

Same compact row pattern:

```text id="wuc24p"
✓  Content-Type       application/json

✓  Authorization      Bearer •••••••••••••

+ Add Header
```

Sensitive values should be visually masked.

---

# 27. Request Body

JSON editor should feel code-oriented.

Example:

```json id="o10cs1"
{
  "email": "user@example.com",
  "password": "example"
}
```

Use:

- Monospace
- Clear line height
- Appropriate padding
- Horizontal scrolling only when necessary

Do not require Monaco for V1.

---

# 28. Invalid JSON

Provide a concise inline error:

```text id="eb9f7j"
Invalid JSON

Expected ',' at line 4.
```

Do not wait until the request reaches the server if the client can identify an obvious JSON formatting problem.

Server validation remains authoritative.

---

# 29. Assertion Builder

Keep assertions understandable to users who are not writing code.

Example:

```text id="rzlnbs"
ASSERTIONS

[ Status Code ▼ ] [ equals ▼ ] [ 200 ]

[ Response Time ▼ ] [ less than ▼ ] [ 500 ] ms

[ JSON Property ▼ ] [ exists ▼ ]
body.user.id

+ Add Assertion
```

Avoid exposing internal assertion JSON in the normal UI.

---

# 30. Response Area

The response should visually feel like the result of the request workspace, not a completely separate page.

Header:

```text id="v2spsw"
RESPONSE

200 OK        243 ms        1.4 KB
```

Then:

```text id="oc3yuv"
Body
Headers
Tests
```

---

# 31. Response Body

JSON:

```json id="80t6hl"
{
  "success": true,
  "user": {
    "id": 14,
    "name": "Example"
  }
}
```

Provide comfortable code readability.

Large bodies should not destroy page layout.

---

# 32. Response Headers

Use a compact key/value list:

```text id="q1xbiz"
content-type        application/json

cache-control       no-store

server              example
```

Avoid putting each header inside a separate card.

---

# 33. Test Results

Example:

```text id="5hgz82"
TESTS                                     3 / 4 passed

✓ Status equals 200

✓ Response time < 500 ms

✓ body.user.id exists

✕ body.user.active equals true
  Expected: true
  Received: false
```

Failures need enough information to debug the expectation.

---

# 34. Error Response

HTTP error:

```text id="rz7pk3"
401 Unauthorized       127 ms       312 B

{
  "error": "Invalid token"
}
```

Do not display:

```text id="oqlfsz"
REQUEST FAILED ❌
```

just because the target returned `401`.

It is still a successful HTTP execution.

---

# 35. Execution Failure

Network failure should look different:

```text id="4txx9w"
Connection failed

API Sentinel could not establish a connection
to the target server.

Check the URL and try again.

[ Retry ]
```

---

# 36. Security Block

Example:

```text id="e7iqjr"
Request blocked

Requests to private or internal network
addresses are not allowed.

Target:
127.0.0.1
```

Do not expose unnecessary infrastructure information.

---

# 37. Timeout

Example:

```text id="y8svbs"
Request timed out

The target API did not respond within
10 seconds.

[ Retry ]
```

---

# 38. Save State

For unsaved request:

```text id="3zowgp"
Untitled Request

[ Save ]
```

Saved endpoint:

```text id="rw7nfb"
Login User

Saved
```

Modified saved endpoint:

```text id="k9e7o8"
Login User

Unsaved changes

[ Save ]
```

---

# 39. Save Endpoint Dialog

Keep concise:

```text id="2a4g5g"
Save Request

Name
[ Login User                    ]

Collection
[ Authentication API         ▼ ]

[ Cancel ]              [ Save ]
```

---

# 40. History Page

Use a dense developer-friendly table/list.

```text id="pnbszu"
History

Search requests...

─────────────────────────────────────────────────────────────

METHOD   ENDPOINT          STATUS      TIME       WHEN

GET      /users            200         184ms      2 min ago

POST     /login            200         327ms      8 min ago

GET      /products         500         412ms      1 hr ago

GET      /profile          401         126ms      Yesterday
```

Desktop should prioritize scanability.

---

# 41. History Detail

Example:

```text id="7mfnlk"
← History

POST /api/login

Executed Sep 30, 10:42 AM

200 OK
243 ms
1.4 KB

────────────────────────────────────────

Response

Body | Headers | Tests
```

Do not turn historical executions into editable requests unless explicitly choosing "Open as request."

---

# 42. Account Area

V1 account area should remain minimal:

```text id="bgy2qh"
Account

[avatar]

Developer Name
developer@example.com

Connected with GitHub

[ Sign Out ]
```

Do not create unnecessary profile customization.

---

# 43. Dialogs

Dialogs should be used for:

- Save request
- Create collection
- Rename collection
- Delete confirmation

Avoid dialogs for routine navigation.

---

# 44. Destructive Confirmation

Example:

```text id="zdbbhl"
Delete Authentication API?

This will remove the collection and its
saved endpoints.

This action cannot be undone.

[ Cancel ]        [ Delete Collection ]
```

Destructive actions should be unmistakable.

---

# 45. Toasts

Use brief feedback for actions such as:

```text id="8p7p8m"
Collection created

Request saved

Endpoint deleted
```

Do not use toasts for information that should remain visible in the page.

---

# 46. Loading

Prefer contextual loading.

Examples:

```text id="znffbh"
Sending request...

Loading history...

Saving endpoint...
```

Avoid a full-screen spinner for small operations.

---

# 47. Skeletons

Skeletons may be used for initial dashboard/list loading.

Keep them subtle.

Do not animate the entire page excessively.

---

# 48. Empty States

Every major data screen requires a meaningful empty state.

Collections:

```text id="6ssrs9"
No collections yet.

Create a collection to organize related APIs.

[ Create Collection ]
```

History:

```text id="kqlyfa"
No request history yet.

Send your first request to see executions here.

[ New Request ]
```

---

# 49. Error States

Errors should answer:

1. What happened?
2. What can the user do?

Bad:

```text id="mv5bln"
Something went wrong.
```

Better:

```text id="h7o5uv"
We couldn't load your request history.

Try again.

[ Retry ]
```

---

# 50. Micro-Interactions

Allowed:

- Subtle button feedback
- Smooth tab transitions
- Sidebar hover
- Dialog transitions
- Small row hover
- Copy confirmation
- Request execution indicator

Keep interactions fast.

Recommended duration:

```text id="z6y71f"
~120–220ms
```

where animation is useful.

---

# 51. Avoid Laggy Hover Effects

Do not animate expensive properties across large lists.

Prefer:

```text id="k9w5ow"
opacity
transform
border-color
background-color
```

Avoid unnecessary:

- Large blur animations
- Constant box-shadow animation
- Layout-changing scale effects
- Multiple simultaneous transforms

Hover effects must feel immediate.

---

# 52. Cards

Cards are allowed when they represent genuine grouped information.

Do not wrap every heading, metric, paragraph and control inside separate cards.

Prefer borders and layout hierarchy over card nesting.

---

# 53. Border Radius

Use restrained radius consistently.

Do not make every component look like a pill.

Pills are appropriate for:

- Small statuses
- Method labels
- Compact badges

Not:

- Large panels
- Editors
- Whole pages

---

# 54. Shadows

Use sparingly.

Most hierarchy should come from:

- Background contrast
- Borders
- Spacing

not huge floating shadows.

---

# 55. Icons

Use one consistent icon set.

Icons should support comprehension.

Examples:

- Send
- Plus
- Search
- Trash
- Settings
- Copy
- Chevron

Do not add icons to every line of text.

---

# 56. Copy Actions

Useful copy buttons:

- URL
- Response body
- Header values where safe

Provide short confirmation:

```text id="k49rgn"
Copied
```

---

# 57. Desktop Breakpoint Philosophy

API Sentinel is primarily a developer desktop application.

At wide sizes:

- Sidebar stays compact.
- Request workspace expands.
- Editors use available height/width.
- Tables remain dense.

Do not center the entire application inside a narrow marketing-site container.

---

# 58. Mobile Layout

Mobile should reorganize rather than shrink.

Example:

```text id="d28w8v"
POST ▼

https://api.example.com/login

[ Send ]

Params | Headers | Body

──────────────────

REQUEST BODY

{ ... }

──────────────────

RESPONSE

200 OK
243ms

Body | Headers | Tests

{ ... }
```

No horizontal page overflow.

Code areas may horizontally scroll internally where necessary.

---

# 59. Mobile Navigation

Use a compact top bar:

```text id="27aw4x"
☰   API Sentinel             User
```

Navigation opens as a drawer.

---

# 60. Responsive Tables

History may convert from a table into compact rows/cards on narrow screens.

Do not force desktop tables beyond viewport width.

---

# 61. Accessibility

Required:

- Semantic buttons
- Form labels
- Keyboard navigation
- Visible focus states
- Proper dialog focus
- Accessible contrast
- Meaningful error text
- Non-color status indicators

---

# 62. Keyboard Behaviour

Where practical:

```text id="nw9u2g"
Tab
→ Navigate controls

Enter
→ Activate focused button

Escape
→ Close dialog
```

Potential later shortcut:

```text id="q7c05f"
Ctrl/Cmd + Enter
→ Send Request
```

Only add shortcuts when they do not conflict with editors.

---

# 63. Focus

Never globally remove outlines without providing an accessible replacement.

Keyboard focus should be obvious but visually consistent.

---

# 64. Long Content

The UI must survive:

- Very long URLs
- Long header values
- Deep JSON
- Long endpoint names
- Large response bodies
- Long error messages

Use:

- truncation where appropriate
- wrapping where appropriate
- internal scrolling for code
- tooltips only when useful

---

# 65. JSON Readability

Response JSON should support:

- indentation
- monospace
- selection/copying
- horizontal scroll for pathological long lines

Syntax highlighting is optional.

Readability is mandatory.

---

# 66. Performance UX

Sending a request must provide immediate acknowledgement.

Example:

```text id="cnrrt4"
Sending...
```

The existing request configuration should remain visible.

Do not replace the whole workspace with a spinner.

---

# 67. Unsaved Request UX

Users should be able to test an API before deciding to save it.

Flow:

```text id="st1q0v"
New Request
   ↓
Configure
   ↓
Send
   ↓
Inspect
   ↓
Save if useful
```

Do not force collection creation before the first request.

---

# 68. First-Time Experience

After first login, direct users toward action:

```text id="yfxb9b"
Welcome to API Sentinel.

Start by testing an API.

[ New Request ]
```

Optional helper:

```text id="vxukpz"
Try:
GET https://...
```

Only use a reliable public demo endpoint if one is intentionally configured.

---

# 69. UI Data Integrity

Do not show optimistic success for important operations before server confirmation.

For example:

```text id="2rhqkz"
Delete endpoint
```

should not permanently disappear from the UI if the database deletion actually failed.

---

# 70. Visual Consistency

The following should use shared components/tokens:

- Buttons
- Inputs
- Selects
- Tabs
- Dialogs
- Badges
- Toasts
- Empty states
- Error states

Avoid individually styling every page from scratch.

---

# 71. Anti-Generic-AI UI Rules

Codex must NOT automatically introduce:

- Purple/blue gradient everywhere
- Glassmorphism panels
- Glowing borders
- Floating orbs
- Particle backgrounds
- Random grid backgrounds
- Excessive rounded cards
- Huge landing hero
- Gradient text on every heading
- Fake terminal animation
- Unnecessary counters
- Decorative charts
- Constant motion
- Random emojis
- "AI-powered" styling

API Sentinel is **not an AI product**.

---

# 72. Anti-Clone Rule

API Sentinel may learn interaction patterns from established developer tools, but it must not visually copy Postman, Insomnia, Bruno or another product.

Create a coherent API Sentinel identity using the design system defined here.

---

# 73. UI Priority

When deciding where to spend design effort:

```text id="bd0mkv"
Request Workspace
      ↓
Response Inspector
      ↓
Collections
      ↓
History
      ↓
Dashboard
      ↓
Landing Page
```

Do not spend half the development time making the landing page flashy.

---

# 74. Motion Priority

Motion should communicate:

- State change
- Navigation
- Feedback

Motion should not exist simply because animation is possible.

Respect reduced-motion preferences.

---

# 75. Required Desktop Testing

Verify at approximately:

```text id="ooyd4e"
1440px
1280px
1024px
```

Check:

- Sidebar
- Request workspace
- Response panel
- Tables
- Dialogs
- Long JSON
- Long URLs

---

# 76. Required Mobile Testing

Verify around:

```text id="sfndx6"
390px
360px
```

Check:

- No page overflow
- Navigation
- URL editor
- Tabs
- JSON editor
- Response body
- History
- Dialogs

---

# 77. Request Workspace Success Criteria

The most important page succeeds when a first-time developer can immediately answer:

- Where do I enter the URL?
- How do I change HTTP method?
- Where do I add headers?
- Where do I add JSON?
- How do I send?
- What status came back?
- How long did it take?
- What body came back?
- Did my tests pass?

without needing documentation.

---

# 78. Final UI Quality Standard

The final interface should feel appropriate next to professional developer tooling.

It should not look like:

> "A student created a dashboard and then added an API form."

It should feel like:

> "This product was designed specifically around API testing."

---

# 79. Codex UI Rule

Before implementing a page, Codex should inspect this document's relevant section.

If existing implementation conflicts with this specification, prefer this specification unless doing so would break a technical requirement.

Do not independently redesign the application during later phases.

---

# 80. Final Experience

The desired interaction is:

```text id="35y6hy"
Open API Sentinel

      ↓

Immediately understand workspace

      ↓

Enter API

      ↓

Configure request naturally

      ↓

Send

      ↓

Response appears clearly

      ↓

Understand status/performance

      ↓

Validate with assertions

      ↓

Save

      ↓

Return later and inspect history
```

Everything else is secondary.