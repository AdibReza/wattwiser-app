# Web architecture and conventions

How the web side's code is organised and the rules every file follows. The
product-level picture (two sides, one database) is in
[`product-brief.md`](./product-brief.md); this document is the code-level one.

---

## 1. Layers

```
browser
  │
  ▼
app/(app)/<route>/page.tsx      screens — server components by default
  │  render                          │  fetch/mutate via
  ▼                                  ▼
components/                     app/api/<route>/route.ts   route handlers
  ui/         shadcn (installed)        │  snake_case ⇄ camelCase, UTC ISO
  layout/     shell, header             ▼
  wattwiser/  product composites   lib/db/                  Drizzle + Supabase
                                        │
                                   lib/readings/            live power source
                                     source.ts   ← interface
                                     mock.ts     ← generator (MVP)
                                     shelly.ts   ← real data (later, same interface)
```

**Rules of the layers**

- Screens never import the raw client (`getDb`). Server components read
  through `lib/db/queries/*`; client components go through route handlers.
  Route handlers use the same `lib/db/queries/*` functions, so there is one
  implementation per table.
- Validation schemas and option lists live in `lib/validation/*` and are shared
  by the form (inline errors) and the route handler (400 responses).
- Route handlers are the only place SQL column names become JSON field names.
- The live power number always comes through `lib/readings/source.ts`.
  Swapping mock for Shelly changes one file and no screen.

---

## 2. Folder map

```
proxy.ts                cookie-only redirect for signed-out visitors (NOT a security boundary)
app/
  layout.tsx            root: font, tooltip provider, toaster
  page.tsx              redirects to /dashboard
  not-found.tsx         styled 404
  globals.css           design tokens (docs/design-system.md)
  (auth)/               public — no shell, no session required
    layout.tsx, login/page.tsx, signup/page.tsx
  (app)/                route group — every customer screen, wrapped in AppShell
    layout.tsx          validates the session; redirects to /login
    loading.tsx         skeleton while that check runs
    dashboard/page.tsx
    appliances/page.tsx, new/page.tsx, [id]/page.tsx
    calibration/[id]/page.tsx
    breakdown/page.tsx
    confirm/page.tsx
    setup/page.tsx
    dev/page.tsx
  api/                  route handlers, paths from docs/specs/api-routes.md
    household/route.ts
    appliances/route.ts, [id]/route.ts, [id]/calibrations/route.ts
    calibration/start/route.ts, [id]/route.ts, [id]/finish/route.ts, [id]/discard/route.ts
    readings/current/route.ts, route.ts
    events/route.ts, [id]/confirm/route.ts
    breakdown/route.ts
    auth/[...all]/route.ts          Better Auth's endpoints (public)
    dev/demo-data/route.ts          load / remove the demo dataset
components/
  ui/                   shadcn/ui — installed by CLI, never hand-edited
  auth/                 AuthShell, AuthForm — the sign-in screens
  layout/               AppShell, SidebarNav, PageHeader, Brand, UserMenu
  wattwiser/            StatCard, StatusBadge, EmptyState, (later) PowerChart, WizardStep…
lib/
  utils.ts              cn()
  auth.ts               Better Auth server instance (email + password, DB sessions)
  auth-client.ts        the browser half: signIn, signUp, signOut
  session.ts            requireHousehold() / getSession() for server components
  api.ts                route-handler helpers: parseBody, requireApiHousehold, badRequest, notFound, unauthorized, serverError
  format.ts             every number/date → text conversion
  tariff.ts             kWh → dollars (peak window, timezone, tier rules)
  tariff.check.ts       PASS/FAIL checks for the cost maths (pnpm check:maths)
  breakdown.ts          aggregates a month of events into the breakdown rows
  nav.ts                the sidebar's item list
  db/                   schema.ts (Drizzle, mirrors data-contract.md), client.ts (getDb()), target.ts (local-only guard)
    queries/            one file per area: household.ts, appliances.ts, readings.ts …
  validation/           zod schemas + option lists shared by forms and routes
  readings/             source.ts (interface), mock.ts (generator; shelly.ts later)
  mock/                 demo-data.ts — the 30-day dataset, shared by the CLI and the /dev button
                        seed.ts — the `pnpm db:seed` command line
drizzle/                generated SQL migrations (pnpm db:generate / db:migrate)
drizzle.config.ts       drizzle-kit config; reads DATABASE_URL from .env.local, local-only guard
supabase/config.toml    local Supabase (Docker) — ports 553xx, db + studio only
justfile                everyday commands: just up / migrate / run / check
.env.example            template for .env.local (the real file is git-ignored)
docs/                   specs and guides (see docs/README.md)
.claude/skills/         agent workflows
```

A folder that does not exist yet is created at the build step noted. Do not
create it earlier.

---

## 3. Conventions

### Naming

| Thing | Style | Example |
|---|---|---|
| files and folders | kebab-case | `status-badge.tsx`, `readings/current/route.ts` |
| React components | PascalCase, one per file, named export | `export function StatCard` |
| functions, variables | camelCase | `formatWatts` |
| database columns | snake_case | `appliance_class` |
| JSON on the wire | camelCase | `applianceClass` |
| route segments | match the screen map exactly | `/appliances/[id]` |
| environment variables | SCREAMING_SNAKE | `DATABASE_URL`, `BETTER_AUTH_SECRET` |

### Components

- Server components by default. Add `"use client"` only for state, effects,
  event handlers, or browser APIs (the sidebar needs the current URL, the
  wizard needs timers).
- Props are a single typed object; no `any`.
- Shared UI goes in `components/wattwiser/` **after** it is used by two
  screens. Before that it stays inside the screen file.
- Import order: react/next, third-party, `@/components`, `@/lib`, relative.

### Data and time

- **Every timestamp is UTC** in the database, on the wire and in state. Only
  `lib/format.ts` converts to local time, and only for display.
- Route handlers validate the body with `zod`, return typed JSON, and use
  proper status codes: 200, 201 on create, 400 on bad input, 404, 500. Error
  body is `{ "error": "plain sentence" }`.
- Confidence is stored `0.0–1.0` and shown High / Medium / Low.
- The Unknown bucket (`events.appliance_id = null`) is always in breakdown output.
- Never send raw readings to a language model.

### Styling

- Tailwind classes only. No CSS modules, no styled-components, no inline
  `style={{}}` except for values that are truly dynamic (a bar width).
- Colours through token classes only (`bg-primary`, `text-warning`). Raw
  Tailwind colours (`bg-blue-600`) are forbidden outside `globals.css`.
- shadcn components are installed with `pnpm dlx shadcn@latest add`, never pasted
  from the web and never modified. Wrap them in `components/wattwiser/` if a
  product-specific variant is needed.

### Quality gates (in this order, every change)

1. `pnpm build` is green — Vercel runs the same build.
2. `pnpm exec eslint .` reports nothing, and `pnpm check:maths` passes.
3. The screen is checked on localhost against `docs/design-system.md` §5–7.
4. Commit as `<emoji> <type>: <message>`, push, confirm Vercel green, open the live URL.

---

## 4. Environment

**Two databases, one rule: local code only ever talks to the local database.**

| Where | Database | `DATABASE_URL` set in |
|---|---|---|
| your Mac (`just run`, `just migrate`) | local Supabase in Docker, port 55322 | `.env.local` |
| Vercel (build and runtime) | hosted Supabase, Transaction pooler, port 6543 | Vercel → Settings → Environment Variables |

### What a signed-in request costs

Better Auth reads `session` and then `user` — **two separate round trips**, not a
join (`advanced.database.joins` is off by default, and `lib/db/schema.ts`
declares no `relations()`). On top of that the app needs the caller's household.
Three queries before a handler does any of its own work, on an endpoint
(`/api/readings/current`) that every open tab polls once a second.

Both costs are removed rather than paid:

| | How |
|---|---|
| the two auth queries | `session.cookieCache` in `lib/auth.ts` — the signed session rides in a cookie for 60s, and `getSession` returns without touching Postgres |
| the household query | a `Map` in `lib/session.ts` — `household.user_id` is unique and set once at sign-up, so the mapping can never go stale |

Measured locally, `/api/appliances` went from **4 queries per request to 1**
(confirmed with `pg_stat_statements`, not inferred from latency). Locally that is
only ~2ms because Postgres is on the same machine; on Vercel, where each round
trip crosses the network to the Supabase pooler, it is the difference that
matters.

The trade: a session revoked **from another device** keeps working here for up to
60 seconds. Signing out in this browser is immediate — it clears the cookie. Any
genuinely sensitive route added later must ask for
`query: { disableCookieCache: true }`.

### Environment variables

| Variable | Local (`.env.local`) | Vercel |
|---|---|---|
| `DATABASE_URL` | local Supabase, port 55322 | hosted Supabase pooler, port 6543 |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` | **a different value**, set in Settings → Environment Variables |
| `BETTER_AUTH_URL` | `http://localhost:3000` | **leave unset** — see below |

`BETTER_AUTH_SECRET` signs and encrypts the session cookie. Local and Vercel must
**not** share one: a shared secret means a cookie minted on a laptop is valid on
the live site. **Set it on Vercel before the first deploy** — without it the build
still succeeds and the site still serves `/login`, but every sign-in returns 500,
so the usual "is the build green?" check will not catch it.

Leave `BETTER_AUTH_URL` unset on Vercel. Better Auth then derives the origin from
the request, so production *and* every preview deployment work. Pinning it to the
production domain makes sign-in fail the CSRF check on preview URLs.

Check that `DATABASE_URL` on Vercel is scoped to **Production**. Set to "All
Environments", every preview deployment would run `drizzle-kit migrate` against
the production database during its build.

The hosted connection string is **never** written to a file on this machine.
`lib/db/target.ts` enforces it: any attempt to open a non-local connection
throws unless `VERCEL=1` (set automatically on Vercel) or an explicit
`ALLOW_CLOUD_DB=true` one-off override. Both the app client and drizzle-kit go
through that guard.

### Local Supabase

Runs in Docker via the Supabase CLI. Config: `supabase/config.toml`. Ports are
in the 553xx range so it never collides with other local projects (default 543xx).
Only the database, Studio and API are enabled; auth, storage, realtime,
analytics and mail are off.

| Command | Does |
|---|---|
| `just up` | start Postgres + Studio (Docker Desktop must be running) |
| `just migrate` | apply `drizzle/*.sql` to the local database |
| `just run` | start the app on http://localhost:3000 |
| `just studio` | open http://127.0.0.1:55323 to browse local tables |
| `just db-reset` | wipe local data and re-apply migrations |
| `just seed` / `just seed-reset` / `just seed-clear` | load / reload / remove the 30-day demo data |
| `just down` | stop the containers |
| `just check` | production build + lint, same as Vercel |

Local login: user `postgres`, password `postgres`, database `postgres`.

### Hosted Supabase

Migrations reach the hosted database **only through Vercel**: the
`vercel-build` script runs `drizzle-kit migrate && next build` on every deploy,
using Vercel's own `DATABASE_URL`. Nobody runs migrations against the cloud
from a laptop. `GET /api/health` on the live URL lists the tables the hosted
database actually has.

### Schema change workflow

edit `lib/db/schema.ts` → `just generate <name>` → `just migrate` (local) →
test on localhost → update `docs/specs/data-contract.md` → push (Vercel
migrates the hosted database during the build). Skill: `db-change`.

## 5. What an agent reads before each kind of task

| Task | Read first |
|---|---|
| any screen | `docs/specs/screens.md` → `docs/design-system.md` → skill `new-screen` |
| any API route | `docs/specs/api-routes.md` → this file §3 |
| any table/column/seed | `docs/specs/data-contract.md` → skill `db-change` |
| mock generator / seed | `docs/specs/mock-data.md` |
| shipping | skill `ship-a-change` |
| "is this in scope?" | `docs/scope-and-decisions.md` |
