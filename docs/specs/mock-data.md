# Mock data

The data side's output is mocked for this MVP so every screen works end to end
before the real pipeline exists. Two separate pieces:

1. **The live generator** — makes the power number move in real time, for the
   dashboard and the calibration wizard chart.
2. **Seed data** — plausible historical rows in `events` and
   `appliance_signatures`, so `/breakdown` and `/confirm` have something to show.

---

## Live generator

From [`milestones.md` §4](../source/milestones.md#4-fake-electricity-data). **Do not hardcode a fixed number.**

```
watts = baseline drifting 300–400 W      (fridge, router, standby)
      + sum of currently "on" simulated appliances
      + random noise ±20 W
```

One value per second.

### Simulated appliances

| Appliance | Watts |
|---|---|
| Kettle | 2200 |
| Washing machine | 2000 |
| Microwave | 1200 |
| Air conditioner | 1500 |

Each is toggled on and off from `/dev` — see
[`screens.md`](./screens.md#8-dev-panel--dev).

### How it is implemented

Vercel has no long-running process, so nothing "ticks" once a second on the
server. Instead:

- `lib/readings/source.ts` is the single interface (`current()`, `range()`).
  `lib/readings/mock.ts` implements it; a future `shelly.ts` replaces it by
  changing one line.
- **Which simulated appliances are on** is stored in the `mock_switches` table
  (web-side, MVP only) so `/dev` and every dashboard tab agree.
- `GET /api/readings/current` computes the value from the clock and the
  switches, writes one `readings` row (at most one per second, however many
  browsers poll), and marks the simulated `devices` row as seen so the
  Dashboard shows **Connected** while something is polling.
- Browsers poll `/api/readings/current` once a second
  (`components/wattwiser/live-tiles.tsx`); the 60-second chart reads
  `GET /api/readings?from=&to=`.

Consequence: history only accumulates while a dashboard or `/dev` tab is open.
That is enough for a demo. Retention (30-day roll-up) is still to do.

### Why it is built this way

- The calibration wizard gets a chart that **genuinely moves**, so the wizard can
  be built and demoed for real rather than mimed.
- It buys a **clean swap to real data later**: change the source, the UI stays
  untouched.

That second point is the design constraint. Keep the generator behind the same
interface the real readings will arrive through, so replacing it touches one
module and no screens.

---

## Seed data

Build step 8. Mocks the data side's output so `/breakdown` and `/confirm` have
content.

Seed these three tables:

| Table | What to seed |
|---|---|
| `readings` | enough history for the charts to have a past, not just a live window |
| `events` | one row per plausible appliance run across the demo month — **including rows with `appliance_id = null`** for the Unknown bucket |
| `appliance_signatures` | one row per calibrated appliance, with a realistic `delta_on_w`, duration range, `sample_count` and `confidence` |

### Rules

- **Include the Unknown bucket.** `events` rows with `appliance_id = null` must
  appear, or `/breakdown` will show a fiction where every watt is assigned.
- **Vary confidence.** Seed a mix of high, medium and low so the UI's handling of
  each is actually exercised.
- **All timestamps in UTC.**
- **Make the numbers add up.** Seeded `events` should roughly reconcile with
  seeded `readings` for the same period — a breakdown that totals more than the
  house consumed is an obvious demo failure.

### How to run it (local)

`lib/mock/seed.ts`, run with the local Supabase up (`just up`):

| Command | Does |
|---|---|
| `just seed` (`pnpm db:seed`) | loads the demo data; does nothing if it is already there |
| `just seed-reset` (`pnpm db:seed --reset`) | removes the demo data and loads it again |
| `just seed-clear` (`pnpm db:seed --clear`) | removes the demo data only |

What it loads: the household (only if none exists — your own setup is never
overwritten), one connected Shelly device, 6 appliances (2 simple, 2
multi-stage, 2 variable-load; 4 calibrated with 3 completed runs and a
signature each), 30 days of events with habits (kettle mornings and evenings,
air conditioner on most evenings, washing machine Wednesday and Saturday,
dishwasher most nights, 1–3 Unknown runs a day), 5 low-confidence events in
the last 3 days for `/confirm`, 3 answered confirmations, and one reading per
minute for the whole window so the energy adds up.

Deterministic: the same numbers every run. Habits are described in the
household's local time (AEST) and **stored in UTC**. The window ends one hour
before "now" so it never overlaps the live generator.

**Removable in one step:** every seeded uuid starts with `5eed0000-`; readings
are removed by the window's time range. Runs only against the local database
(`lib/db/target.ts`); to seed the hosted database deliberately, run it with
`ALLOW_CLOUD_DB=true` and the hosted `DATABASE_URL` in the environment.

### These seeds are temporary

The web side is not the writer of these three tables — the data side is. See
[`data-contract.md`](./data-contract.md#write-ownership).

**Keep every seed removable in one step.** Once the real pipeline runs, the seeds
are deleted and the data side becomes the only writer. Tag or namespace the seeded
rows so they can be identified and dropped without touching real data.
