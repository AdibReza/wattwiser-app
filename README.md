# WattWiser

**NILM (Non-Intrusive Load Monitoring).** One Shelly EM Gen3 with a CT clamp measures
whole-house electricity; the system works backwards to identify individual
appliances, so a household can see where the bill goes.

## The problem

A household gets one electricity bill and no idea what drove it. Metering every
appliance individually means an electrician, a smart plug per socket, and a cost
nobody will pay.

WattWiser solves it with **one sensor** at the meter.

## How it works

The sensor reports a single number — whole-house power, roughly once a second.
Working backwards from that needs two things the sensor cannot supply:

1. **What the household owns** — declared once, in the setup form and the appliance inventory
2. **What each appliance looks like in the data** — learned through guided calibration

That is why **the input UI is the primary goal**, not the dashboard. The
dashboard is what the input UI makes possible.

## Architecture

Two sides that never call each other. They meet only at a shared PostgreSQL
database (Supabase).

| Side | Stack | Owns |
|---|---|---|
| **Web** | Next.js on Vercel | every screen, every API route, the database schema |
| **Data** | separate Python service | MQTT subscriber, edge detection, event pairing, signature building |

The data side's output (`readings`, `events`, `appliance_signatures`) is **mocked
by the web side**, so every screen works end to end before the pipeline exists.

## Running locally

Prerequisites: Docker Desktop, Supabase CLI, [mise](https://mise.jdx.dev), [just](https://just.systems).

```bash
mise install                  # Node 22.23.1 + pnpm 10.26.2
just install                  # install packages (pnpm ONLY — never npm)
cp .env.example .env.local    # points at the local database
just up                       # start Supabase in Docker
just migrate                  # create the tables
just seed                     # load 30 days of demo data
just run                      # http://localhost:3000
```

Run `just` to list every command.

## Two databases, one rule

Local code only ever talks to the local database. The hosted connection string
lives **only** in Vercel's environment variables, never in a file on your
machine — `lib/db/target.ts` enforces this. Migrations reach the hosted database
only through the Vercel build (`vercel-build`).

## Shipping a change

```bash
just check    # production build + lint + cost-maths checks — what Vercel runs
git commit -m "<emoji> <type>: <message>"
git push
```

Then confirm the Vercel build is green and **open the live URL**. A green build
means the code compiled, not that the page works.

**Never stack new work on a red build.**

## Documentation

| I need to… | Read |
|---|---|
| Understand the project and its locked decisions | [`CLAUDE.md`](./CLAUDE.md) |
| Find the spec for a task | [`docs/README.md`](./docs/README.md) |
| Build or change a page | [`docs/specs/screens.md`](./docs/specs/screens.md) |
| Add or alter a table | [`docs/specs/data-contract.md`](./docs/specs/data-contract.md) |
| Add or change an API route | [`docs/specs/api-routes.md`](./docs/specs/api-routes.md) |

## Stack

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL
(Supabase) · Vercel · pnpm
