# WattWiser

NILM (Non-Intrusive Load Monitoring). A Shelly EM Gen3 with a CT clamp measures
whole-house electricity; the system works backwards to identify individual
appliances, so a household can see where the bill goes.

**Read this file first. Then read `docs/README.md` to find the spec for your task.**

---

## Architecture in one paragraph

Two sides that never call each other. They meet only at a shared PostgreSQL
database (Supabase).

| Side | Stack | Owns |
|---|---|---|
| **Web** | Next.js on Vercel | every screen, every API route, the database schema |
| **Data** | separate Python service, deployed separately | MQTT subscriber, edge detection, event pairing, signature building |

The web side owns the contract: it defines the schema, publishes it, and
proactively drives the connection with the data side. **Never treat the data
side as a blocker** — everything it will eventually produce is mocked first.

Details: `docs/product-brief.md`. Table-by-table write ownership:
`docs/specs/data-contract.md`.

---

## Locked decisions — do not re-litigate

- **Next.js only** on the web side. No FastAPI, no Python on the web side.
- **Tailwind CSS v4 + shadcn/ui** for all styling and components. Tokens live in
  `app/globals.css`; the rules are in `docs/design-system.md`. No other UI
  library, no CSS-in-JS, no hand-edited files in `components/ui/`.
- **Supabase** (PostgreSQL) for the database.
- **No authentication** in this MVP. Single household, one shared dataset.
  No login or register screens.
- **The data side's output is mocked.** The web side seeds `readings`, `events`
  and `appliance_signatures` itself so every screen works end to end.
- **Primary MVP goal: a working input UI** — household profile, appliance
  inventory, guided calibration — plus a dashboard and breakdown on mock data.

Cut from this MVP, kept as future roadmap: Raspberry Pi, self-hosted Mosquitto,
and all ML (K-Means, DBSCAN, Random Forest, Seq2Point, HMM/FHMM, CNN/RNN,
transfer learning).

Full rationale and the cut list: `docs/scope-and-decisions.md`.

---

## Who you are helping

Someone who has **never written code** and works by prompting Claude Code. So:

- Explain any new term immediately, in plain everyday language.
- Prefer clicking through a UI over typing terminal commands. When a command is
  unavoidable, say exactly where to type it, what a correct result looks like,
  and what failure looks like.
- For anything substantial, give a ready-to-paste prompt rather than asking them
  to describe it themselves.
- Never hand over long code blocks to assemble by hand.
- One step at a time, each with a way to verify before moving on.
- When they report an error: explain the cause in plain language first, then fix it.

---

## Working rules

- Get an empty page live on Vercel on day one. After that, every feature follows
  the same loop: **build → test on localhost → commit and push → confirm the
  Vercel build is green → check the live URL.** Use the `ship-a-change` skill.
- **Never stack new work on a red build.**
- **Commit messages ALWAYS use the format `<emoji> <type>: <message>`**, e.g.
  `✨ feat: add household setup form`. Types and their emoji:
  ✨ feat · 🐛 fix · 📝 docs · 🎨 style · ♻️ refactor · ✅ test · 🔧 chore ·
  🚀 deploy · 🗃️ db. Message in the imperative, lowercase, no trailing period.
- Every screen must look **simple and modern. Ugly is not acceptable.** Clean
  spacing, one clear primary action per screen, readable numbers.
- **All timestamps in UTC**, everywhere, converted only at the display layer.
  Calibration matches time windows — a timezone mismatch breaks the whole
  pipeline silently, with no error message.
- Never propose: Docker, CI/CD, microservices, Kubernetes, self-hosting,
  hand-rolled complex auth, or ML.
- Code layout and naming follow `docs/architecture.md`. Every status word goes
  through `StatusBadge`, every number through `lib/format.ts`, every screen
  starts with `PageHeader` and has exactly one primary action.
- If there is a simpler way, say so directly.
- Tone: direct, no padding, no flattery. Keep it short.

---

## Source documents

The project began with three team documents, now converted to Markdown in
[`docs/source/`](./docs/source/). They are the best explanation of *why* the
system works the way it does — the NILM approach, the three appliance classes,
why calibration is necessary.

⚠️ **They predate the decisions above.** They describe React, FastAPI, login
screens, a Raspberry Pi collector and a full ML stack — **none of which this MVP
builds.** Where a source document and this file disagree, **this file wins.**
Read them for domain intent, never for stack or scope. Full list of what was
superseded: [`docs/source/README.md`](./docs/source/README.md#superseded-by-the-locked-decisions).

---

## Skills

| Skill | Use when |
|---|---|
| `ship-a-change` | Any change is ready to go live — runs the build/test/deploy/verify loop |
| `new-screen` | Building or changing any page under the screen map |
| `db-change` | Adding or altering a table, column, or seed |
| `design-review` | Before shipping any screen — checks it against the design system |
