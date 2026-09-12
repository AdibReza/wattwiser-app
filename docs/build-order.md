# Build order

From [`milestones.md`](source/milestones.md). Build in this order — each step depends on the ones
before it.

**Steps 1–8 are the skeleton and are not cuttable. The product is demoable at
step 8. Steps 9–10 are where the value shows.**

| # | Step | Done when | Spec |
|---|---|---|---|
| 1 | **Skeleton deployed** | An empty page is live on a real Vercel URL. Day one. | — |
| 2 | **Database and tables** | Every table in the contract exists in Supabase and the app can read from it. | [`specs/data-contract.md`](./specs/data-contract.md) |
| 3 | **Household setup form** | `/setup` saves the single `household` row and can be reopened to edit it. | [`specs/screens.md`](./specs/screens.md#1-household-setup--setup) |
| 4 | **Appliances CRUD** | Appliances can be listed, added, edited and deleted, and survive a reload. | [`specs/screens.md`](./specs/screens.md#3-appliances--appliances) |
| 5 | **Mock generator + `/dev`** | Toggling a simulated appliance on `/dev` visibly moves the power number. | [`specs/mock-data.md`](./specs/mock-data.md) |
| 6 | **Dashboard** | `/dashboard` shows live power, today's energy, device status and a moving chart. | [`specs/screens.md`](./specs/screens.md#2-dashboard--dashboard) |
| 7 | **Calibration wizard** — the core | A run creates exactly one `calibration_sessions` row, and the chart moves during recording. | [`specs/screens.md`](./specs/screens.md#5-calibration-wizard--calibrationid) |
| 8 | **Seed script** | `events` and `appliance_signatures` hold plausible mock rows; the app is demoable end to end. | [`specs/mock-data.md`](./specs/mock-data.md#seed-data) |
| 9 | **Breakdown + cost** | `/breakdown` shows kWh, percentage, cost and confidence per appliance, plus an Unknown row. | [`specs/screens.md`](./specs/screens.md#6-breakdown--breakdown) |
| 10 | **Confirmation UI** | Answering a question on `/confirm` writes an `event_confirmations` row. | [`specs/screens.md`](./specs/screens.md#7-confirmation--confirm) |

## Two things that run alongside, not in sequence

**Hand the contract to the data side as early as step 2.** It is the web side's
job to drive that connection, and the data side has its own build to do. See
[`guides/data-side-handover.md`](./guides/data-side-handover.md).

**Verify the hardware assumptions the day the Shelly arrives** — clock skew and
real sample rate. Both silently invalidate calibration if wrong, and neither is
discoverable from the web app. See
[`guides/known-pitfalls.md`](./guides/known-pitfalls.md).

## The loop for every step

Build → test on localhost → commit and push → confirm the Vercel build is green
→ check the live URL. Use the `ship-a-change` skill. Never start the next step on
a red build.
