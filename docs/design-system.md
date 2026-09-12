# Design system

How every WattWiser screen looks and behaves. Built on **Tailwind CSS v4** and
**shadcn/ui** (Radix primitives, "nova" style). The visual direction comes from
the original team figures in [`source/images/`](./source/images/): a white
sidebar with a blue active item, white cards on a light grey ground, one big
green number for live power, orange for "Not Calibrated".

**The rule above every other rule: simple and modern. Ugly is not acceptable.**

> The figures show Login, Register, Logout, a Settings page and a separate
> Calibration History page. Those are cut (see
> [`scope-and-decisions.md`](./scope-and-decisions.md)). Settings became
> `/setup`; calibration history lives on `/appliances/[id]`; there is no auth.
> The *style* of the figures is kept, the *screen list* comes from
> [`specs/screens.md`](./specs/screens.md).

---

## 1. Tokens

Defined once in [`app/globals.css`](../app/globals.css), in three layers.
**Never write a raw colour in a component.** Use the Tailwind class that maps
to a token.

| Layer | Example | Who reads it |
|---|---|---|
| Primitive | `--blue-600`, `--zinc-200` | only the semantic layer |
| Semantic | `--power`, `--warning`, `--neutral` | product meaning, used in classes like `text-power` |
| Component | `--primary`, `--card`, `--border` | shadcn/ui components |

### Colour meaning

| Token / class | Meaning | Where |
|---|---|---|
| `bg-primary` (blue) | the one primary action, active nav item, live chart line | buttons, sidebar, chart series 1 |
| `text-power` (green) | **the live power number only**, and anything good: Connected, Calibrated, High | dashboard tile, badges |
| `text-warning` (amber) | needs attention, not an error: Not Calibrated, "Hold on — something else is running" | badges, alerts |
| `text-danger` (red) | genuinely wrong: failed save, destructive confirm | destructive buttons, form errors |
| `text-neutral` (grey) | unknown / inactive: Not Connected, Unknown bucket, Discarded, Low | badges |
| `text-muted-foreground` | labels, hints, secondary text | everywhere |

Each status colour has a `-soft` background pair (`bg-warning-soft`) for badges
and callouts. **Light theme only in this MVP.** No dark mode toggle.

### Typography

Geist (loaded in `app/layout.tsx`). Weights: 400 body, 500 labels and nav,
600 headings and numbers. Sizes:

| Use | Class |
|---|---|
| Page title | `text-2xl font-semibold tracking-tight` |
| Card / section title | `text-base font-medium` |
| Stat value | `text-3xl font-semibold tabular` |
| Body | `text-sm` |
| Label, hint | `text-sm text-muted-foreground` |
| Badge | `text-xs font-medium` |

Numbers always get the `tabular` class so digits line up in columns.

### Spacing and shape

- Base spacing scale is Tailwind's. Page padding `px-4 py-6` on mobile,
  `px-8 py-8` on desktop. Card padding `p-5`. Gap between cards `gap-4`.
- Content max width `max-w-5xl`, centred.
- Radius `--radius: 0.625rem` (cards `rounded-xl`, buttons `rounded-lg`,
  badges `rounded-full`).
- Cards: white, 1px `border`, no heavy shadows.

---

## 2. Layout

The **app shell** ([`components/layout/app-shell.tsx`](../components/layout/app-shell.tsx))
is the frame from the "Dashboard (Basic)" figure:

```
┌──────────────┬──────────────────────────────────────┐
│ ⚡ WattWiser  │  Page title                 [Action] │
│              │  description                          │
│ ▣ Dashboard  │                                       │
│   Appliances │  ┌────────┐ ┌────────┐ ┌────────┐     │
│   Breakdown  │  │ tile   │ │ tile   │ │ tile   │     │
│   Confirm    │  └────────┘ └────────┘ └────────┘     │
│ ──────────── │                                       │
│   Household  │  ┌──────────────────────────────┐     │
│   setup      │  │ main content card            │     │
│   Demo       │  └──────────────────────────────┘     │
│   controls   │                                       │
└──────────────┴──────────────────────────────────────┘
```

- Sidebar is 240px on `md` and up; on mobile it becomes a top bar with a
  menu button that opens a drawer (shadcn `Sheet`).
- Nav items come from one list, [`lib/nav.ts`](../lib/nav.ts). Add a screen
  there and every menu updates. Calibration is **not** in the menu: it always
  starts from an appliance.
- Every customer screen lives in the `app/(app)/` route group so it gets the
  shell automatically. `/calibration/[id]` also uses the shell; the wizard's
  own steps live inside the content area.

---

## 3. Components

### shadcn/ui (in `components/ui/`, installed, do not hand-edit)

button · card · badge · input · label · textarea · select · radio-group ·
switch · field · dialog · alert-dialog · alert · sheet · table · separator ·
skeleton · progress · tooltip · sonner (toasts)

Add more with `pnpm dlx shadcn@latest add <name>`. Do not re-implement anything on
this list by hand.

### WattWiser composites (in `components/wattwiser/` and `components/layout/`)

| Component | Use it for | Never |
|---|---|---|
| `PageHeader` | title, description, **the one primary action** | two primary buttons |
| `StatCard` | label + big number tiles; `tone="power"` for live watts | a fixed fake number |
| `StatusBadge` | every status word, see vocabulary below | inventing a new status string inline |
| `EmptyState` | a screen with nothing yet; always says what to do next | a blank card |

Charts arrive at build step 6 with **Recharts** through shadcn's `chart`
component. Series colours are `--chart-1` … `--chart-5`; series 1 is always
the live power line.

### Status vocabulary

The only words allowed for state, fixed in
[`status-badge.tsx`](../components/wattwiser/status-badge.tsx):

| Status | Word shown | Colour |
|---|---|---|
| appliance calibrated | Calibrated | green |
| appliance not calibrated | Not Calibrated | amber |
| device online | Connected | green, dot |
| device offline / unknown | Not Connected | grey, dot |
| session running | Recording | blue, dot |
| session finished | Complete | green |
| session cancelled | Discarded | grey |
| confidence | High / Medium / Low | green / amber / grey |
| unassigned energy | Unknown | grey |

---

## 4. Numbers and words

All formatting goes through [`lib/format.ts`](../lib/format.ts). Screens
never call `toFixed` themselves.

| Value | Shown as | Helper |
|---|---|---|
| watts | `850 W`, `2.2 kW` above 1000 | `formatWatts` |
| energy | `2.4 kWh` | `formatKwh` |
| cost | `$12.50` | `formatCost` |
| share | `30%`, `2.4%` under 10 | `formatPercent` |
| confidence 0.0–1.0 | High / Medium / Low, **never the decimal** | `confidenceLabel(confidenceFromScore(x))` |
| timestamp (UTC on the wire) | local time, `12 Sep 2026, 7:15 pm` | `formatDateTime` |
| missing value | `—` | every helper |

Copy rules: plain words, no jargon ("Not Connected", never "MQTT timeout");
an estimate is never presented as a measurement; sentence case for titles and
buttons ("Start calibration", not "Start Calibration").

---

## 5. Screen anatomy

Every screen, in this order:

1. `PageHeader` with exactly one primary `Button` (or none).
2. Stat tiles if the screen has headline numbers (`grid gap-4 sm:grid-cols-2 lg:grid-cols-4`).
3. One main content card, or a list of cards / a table.
4. Secondary actions are `variant="outline"` or `variant="ghost"`.

Required states for every screen that loads data:

| State | Show |
|---|---|
| loading | `Skeleton` in the shape of the content, never a spinner alone |
| empty | `EmptyState` with the next action |
| error | `Alert variant="destructive"` with a plain sentence and a retry |
| success after save | `toast.success("Saved")` from sonner, then navigate |

Forms: shadcn `Field` + `Input`/`Select`, labels above inputs, one column,
the submit button at the bottom right. Validation messages are plain sentences.

---

## 6. Responsive and accessible

- Mobile first. Tiles stack to one column under `sm`; the sidebar becomes a
  drawer under `md`.
- Every icon-only button has `aria-label`. Every status badge is text, not just
  colour. Focus rings stay on (Tailwind `outline-ring`).
- Minimum tap target 40px. Body text never below `text-sm`.

---

## 7. Do / don't

| Do | Don't |
|---|---|
| use a token class (`bg-warning-soft`) | write `bg-amber-50` or a hex in a screen |
| one primary button per screen | two blue buttons side by side |
| `StatusBadge status="not-calibrated"` | `<span className="text-orange-500">Not calibrated</span>` |
| `formatWatts(w)` | `` `${w} W` `` |
| `EmptyState` with a next step | an empty white card |
| keep `components/ui/` as installed | editing shadcn files by hand |
