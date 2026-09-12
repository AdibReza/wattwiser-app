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

### These seeds are temporary

The web side is not the writer of these three tables — the data side is. See
[`data-contract.md`](./data-contract.md#write-ownership).

**Keep every seed removable in one step.** Once the real pipeline runs, the seeds
are deleted and the data side becomes the only writer. Tag or namespace the seeded
rows so they can be identified and dropped without touching real data.
