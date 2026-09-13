# Scope and decisions

Each decision below is **locked**. An agent should not reopen one; if a change
looks necessary, raise it with the user rather than working around it.

## Locked decisions

| Decision | Consequence |
|---|---|
| **Next.js only on the web side** | No FastAPI. No Python anywhere in the web app. Every API route is a Next.js route handler. |
| **Supabase (PostgreSQL)** | One database, shared by both sides. It is the entire integration surface. |
| **Vercel for deployment** | No Docker, no self-hosting, no container orchestration. |
| **Claude Code as the AI tool** | Instructions are written as ready-to-paste prompts, not as tasks to describe from scratch. |
| **Email + password authentication** | Better Auth on the same Postgres. Sessions in the database. `/login` and `/signup` are the only public screens. |
| **One household per account** | Every table carries `household_id`. Nobody can read or change another account's data, enforced in the query layer. |
| **The data side's output is mocked** | The web side seeds `readings`, `events` and `appliance_signatures` so every screen works end to end before the pipeline exists. |
| **A working input UI is the primary goal** | Household profile, appliance inventory and guided calibration come before polish on the dashboard. |

### Why authentication, after starting without it

This MVP deliberately shipped without accounts: one household, one shared
dataset, and a schema shaped so that going multi-household later meant *adding a
`household_id` foreign key, not rebuilding*. That is exactly what happened.

What it cost, when the time came: `household_id` on eight tables, a `householdId`
first argument on every query function, one guard at the top of every route
handler, and two screens. No table was redesigned.

**Row-level security is not used.** The app connects to Postgres as the owner
through Drizzle, not as a Supabase `authenticated` role, so RLS would never
engage. Scoping lives in the query layer instead, which is why every function in
`lib/db/queries/*` takes `householdId` explicitly rather than reading it from
ambient context — a missing scope is then a build error, not a silent leak.

## Cut from this MVP

Kept as future roadmap. **Do not build these, and do not propose them.**

**Hardware and infrastructure**
- Raspberry Pi as an edge device
- Self-hosted Mosquitto MQTT broker
- Docker, CI/CD pipelines, microservices, Kubernetes, any self-hosting

**Machine learning** — every approach in [`refined-flow-and-tasks.md` §9](source/refined-flow-and-tasks.md#9-existing-nilm-models):
- Clustering: K-Means, DBSCAN
- Classification: Random Forest
- Deep learning: Seq2Point, CNN, RNN
- Sequence models: HMM, FHMM
- Transfer learning

**What replaces ML in this MVP:** rule-based edge detection plus threshold
matching against calibrated signatures. That is the data side's whole scope for
this build.

**Also cut**
- Hand-rolled auth (Better Auth is a library, not a hand-rolled scheme)
- Social / SSO sign-in, password reset emails, email verification — no mail
  server exists in this MVP
- Any per-appliance metering hardware

## In scope, but only if time allows

From [`refined-flow-and-tasks.md` §13](source/refined-flow-and-tasks.md#13-customer-dashboard), on the `/breakdown` screen:

- **Unusual usage callout** — "Hot water consumption is significantly higher
  than usual"
- **Recommendations** — "Your dishwasher frequently runs during your expensive
  tariff period"

Both are optional. Neither is allowed to block the required parts of the screen.

### The rule for any generated wording

**Code does the maths; generated text only writes the words.**

Never send raw readings to a language model. Query the database, produce a short
numeric summary, generate prose from that summary only, and **cache the result**
so a flaky connection during a demo does not leave the page blank.

## Non-negotiable quality bars

- **Every screen must look simple and modern. Ugly is not acceptable.** Clean
  spacing, one clear primary action per screen, readable numbers.
- **Never stack new work on a red build.** A feature is not finished until the
  Vercel build is green and the live URL has been checked.
- **All timestamps in UTC.** See [`guides/known-pitfalls.md`](./guides/known-pitfalls.md).
