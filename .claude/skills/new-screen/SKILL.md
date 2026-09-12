---
name: new-screen
description: Build or change a page in the WattWiser web app. Use for any work on /setup, /dashboard, /appliances, /calibration, /breakdown, /confirm, or /dev — adding a screen, changing its fields, its copy, or its layout. Loads the screen spec and enforces the visual and data rules.
---

# Build a screen

## Before writing anything

1. **Find the screen in `docs/specs/screens.md`.** Every route is specified there
   — fields, copy, behaviour. Build what it says; do not invent fields.
2. **Check which API routes it needs** in `docs/specs/api-routes.md`. If the route
   does not exist yet, build it first.
3. **Check which tables it touches** in `docs/specs/data-contract.md` — in
   particular whether the web side is allowed to write them.
4. **Read `docs/design-system.md`** — tokens, layout shell, the component list
   and the status vocabulary. And `docs/architecture.md` §2 for where the files go.

If the spec is ambiguous, ask. Do not guess and do not silently extend scope.

## Non-negotiable rules

**Visual — simple and modern. Ugly is not acceptable.**
- Clean spacing, generous whitespace.
- **One clear primary action per screen.**
- Readable numbers: large where the number is the point (current power), aligned
  and consistently formatted everywhere else.

**Build with the system, not around it**
- The page lives in `app/(app)/<route>/page.tsx` so it gets the sidebar shell.
- Start with `PageHeader`; put the one primary `Button` in its `action` slot.
- Headline numbers use `StatCard`; every status word uses `StatusBadge`; a screen with nothing
  to show yet uses `EmptyState`; loading uses `Skeleton`; errors use `Alert`.
- Forms: shadcn `Field` + `Input` / `Select` / `RadioGroup` / `Switch`, one
  column, submit bottom-right, `toast.success` on save.
- Numbers and dates only through `lib/format.ts`. Colours only through token
  classes (`text-power`, `bg-warning-soft`). Never `bg-blue-600`, never a hex.
- Need a shadcn component that is not installed? `pnpm dlx shadcn@latest add <name>`.
  Never paste one in by hand, never edit `components/ui/`.

**Data**
- **All timestamps UTC**, converted to local time only at the display layer.
- **Confidence renders as High / Medium / Low**, never as a decimal — even though
  `events.confidence` is stored as `0.0–1.0`.
- **The Unknown / Other row always shows** on `/breakdown`. Never present a
  breakdown where every watt is assigned.
- **No login, no auth, no user switching.** Single household, one shared dataset.

**Language**
- No jargon in user-facing copy. "Not Connected", not "MQTT timeout".
- Never present an estimate as a measurement.

## Screens with extra requirements

**`/calibration/[id]`** — the core of the MVP, and the easiest to get wrong:
- Wizard copy **changes by appliance class** (simple / multi-stage /
  variable-load). Three variants, not one.
- Exactly **one** `calibration_sessions` row per run.
- **Cancel on every step**, marking the session `discarded`.
- The **contamination guard** before step 1: total power stable within 50 W over
  5 seconds, or show "Hold on — something else is running."

**`/breakdown`** — if you add generated wording: code does the maths, generated
text only writes the words, from a short numeric summary. Never send raw readings
to a language model. **Cache the result** so a flaky connection during a demo does
not leave the page blank.

**`/dev`** — not a customer screen. Function over polish, but it must reliably
move the numbers during a live demo.

## When you are done

Run the `design-review` skill, then the `ship-a-change` skill. A screen is not finished until it is green on
Vercel and has been looked at on the live URL.
