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
app/
  layout.tsx            root: font, tooltip provider, toaster
  page.tsx              redirects to /dashboard
  not-found.tsx         styled 404
  globals.css           design tokens (docs/design-system.md)
  (app)/                route group — every customer screen, wrapped in AppShell
    layout.tsx
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
components/
  ui/                   shadcn/ui — installed by CLI, never hand-edited
  layout/               AppShell, SidebarNav, PageHeader
  wattwiser/            StatCard, StatusBadge, EmptyState, (later) PowerChart, WizardStep…
lib/
  utils.ts              cn()
  format.ts             every number/date → text conversion
  nav.ts                the sidebar's item list
  db/                   schema.ts (Drizzle, mirrors data-contract.md), client.ts (getDb()), target.ts (local-only guard)
    queries/            one file per table: household.ts, appliances.ts …
  validation/           zod schemas + option lists shared by forms and routes
  readings/             source.ts, mock.ts                          ← build step 5
  mock/                 seed script                                 ← build step 8
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
| environment variables | SCREAMING_SNAKE, read only in `lib/db/client.ts` | `DATABASE_URL` |

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
2. `pnpm exec eslint .` reports nothing.
3. The screen is checked on localhost against `docs/design-system.md` §5–7.
4. Commit as `<emoji> <type>: <message>`, push, confirm Vercel green, open the live URL.

---

## 4. Environment

**Two databases, one rule: local code only ever talks to the local database.**

| Where | Database | `DATABASE_URL` set in |
|---|---|---|
| your Mac (`just run`, `just migrate`) | local Supabase in Docker, port 55322 | `.env.local` |
| Vercel (build and runtime) | hosted Supabase, Transaction pooler, port 6543 | Vercel → Settings → Environment Variables |

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
