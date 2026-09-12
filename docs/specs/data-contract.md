# Database schema and contract

> **Agree this before either side writes code.** Once table and column names are
> locked, the two sides run in parallel with no coupling.

Table names map to the list in [`milestones.md` §2](../source/milestones.md#2-database) — differences are noted where
they exist.

**Implemented in** [`lib/db/schema.ts`](../../lib/db/schema.ts) (Drizzle).
Migrations live in [`drizzle/`](../../drizzle/). This document and that file
must always agree; change both in the same commit.

## Write ownership

**Rule: only one side writes each table. The other reads only.**

| Table | Web side | Data side |
|---|---|---|
| `household` | **write** + read | read |
| `devices` | **write** + read | read |
| `appliances` | **write** + read | read |
| `calibration_sessions` | **write** + read | read |
| `appliance_signatures` | read | **write** |
| `readings` | read (+ mock writes for this MVP) | **write** |
| `events` | read (+ mock writes for this MVP) | **write** |
| `event_confirmations` | **write** + read | read |

> For this MVP the web side also seeds `readings`, `events` and
> `appliance_signatures` with mock rows, since the real pipeline isn't running
> yet. **Once it is, those seeds are deleted and the data side becomes the only
> writer.** See [`mock-data.md`](./mock-data.md).

---

## Schema

### `household`

Single row for this MVP. Replaces the `Users` table in [`milestones.md`](../source/milestones.md) — no
authentication in this scope. Going multi-household later means adding a
`household_id` foreign key to the other tables, not rebuilding them.

```sql
id                uuid    primary key
label             text
occupants         int
home_type         text        -- house | apartment | townhouse
hot_water         text        -- electric | gas | solar | heat_pump | unknown
heating           text
cooling           text
has_solar         boolean
has_battery       boolean
has_ev            boolean
tariff_type       text        -- flat | time_of_use | tiered
tariff_config     jsonb       -- rates; shape depends on tariff_type
created_at        timestamptz default now()
updated_at        timestamptz
```

`tariff_config` shape by `tariff_type` (all rates in $/kWh):

| `tariff_type` | `tariff_config` |
|---|---|
| `flat` | `{ "rate": 0.30 }` |
| `time_of_use` | `{ "peakRate": 0.45, "offPeakRate": 0.20 }` |
| `tiered` | `{ "tier1Rate": 0.25, "tier1UpToKwh": 300, "tier2Rate": 0.35 }` |

Allowed values: `home_type` house | apartment | townhouse · `hot_water` electric | gas |
solar | heat_pump | unknown · `heating` electric | gas | reverse_cycle_ac | none ·
`cooling` split_ac | ducted_ac | fans_only | none. Source of truth in code:
`lib/validation/household.ts`.

### `devices`

The Shelly. From [`milestones.md` §2](../source/milestones.md#2-database). Minimal for this MVP — it drives the
Dashboard's Connected / Not Connected tile.

```sql
id                uuid    primary key
name              text                    -- "Shelly EM Gen3 - main"
device_type       text
last_seen_at      timestamptz             -- null or stale = Not Connected
status            text                    -- connected | disconnected | unknown
created_at        timestamptz default now()
```

### `appliances`

What the household declares it owns.

```sql
id                uuid    primary key
name              text    not null        -- "Kettle"
category          text                    -- "Kitchen"
appliance_class   text    not null        -- simple | multi_stage | variable_load
rated_watts       int                     -- nameplate; reference only
brand_model       text
common_settings   text                    -- "usually 40°C cotton cycle"
notes             text
created_at        timestamptz default now()
```

> `rated_watts` **narrows the candidate set only** — never the identification
> method. [`refined-flow-and-tasks.md` §3](../source/refined-flow-and-tasks.md#3-initial-appliance-inventory) is explicit: appliances have multiple
> modes, stages, heating cycles and variable-speed components, so the nameplate
> figure cannot be trusted as an identifier. The real figures come from
> calibration.
>
> `appliance_class` matters to **both sides**: it drives the wizard copy on the
> web side, and tells the data side which calibration approach produced the data
> ([`refined-flow-and-tasks.md` §5](../source/refined-flow-and-tasks.md#5-different-calibration-approaches)).

### `calibration_sessions`

One row per wizard run. Multiple runs per appliance are expected — 3 to 5.

```sql
id                uuid    primary key
appliance_id      uuid    references appliances(id)
started_at        timestamptz not null    -- when the user confirmed "on"
ended_at          timestamptz             -- null = still running
status            text    not null        -- running | completed | discarded
baseline_w        numeric                 -- total power before switch-on
created_at        timestamptz default now()
```

> **This is the main output of the web side.** The data side reads `started_at` /
> `ended_at`, slices the matching window of `readings`, and derives a signature
> from it.

### `appliance_signatures`

Derived per household. **Data side writes; web side reads for display.**

```sql
id                uuid    primary key
appliance_id      uuid    references appliances(id)
delta_on_w        numeric               -- power step on switch-on
delta_off_w       numeric               -- power step on switch-off
duration_min_s    int
duration_max_s    int
pattern           jsonb                 -- multi-stage sequence, if any
sample_count      int                   -- calibration runs used
confidence        text                  -- high | medium | low
updated_at        timestamptz
```

> `pattern` exists because [`refined-flow-and-tasks.md` §5](../source/refined-flow-and-tasks.md#5-different-calibration-approaches) requires multi-stage
> appliances to store a **sequence** (motor → heating → lower load → spin → pump
> → off), not a single wattage. Simple appliances can leave it null.

### `readings`

Raw whole-house measurements. Called `Electricity Readings` in [`milestones.md`](../source/milestones.md).

```sql
id                bigserial primary key
ts                timestamptz not null
watts             numeric not null
volts             numeric
amps              numeric
power_factor      numeric
```

Index on `(ts)`.

> [`refined-flow-and-tasks.md` §6](../source/refined-flow-and-tasks.md#6-data-processing): all individual 1-second measurements are
> retained. Readings may be **transmitted in batches** every 5–30 seconds without
> reducing the underlying 1-second resolution — batching is a transport detail,
> not a resolution change.
>
> **Retention:** 86,400 rows/day ≈ 2.6M rows/month. Keep 1-second raw for 30 days,
> then roll up to 1-minute averages. No free tier survives keeping it forever.

### `events`

Detected appliance runs with an identification attached. This is the
`Predictions` table in [`milestones.md`](../source/milestones.md) — same thing, named for what it holds.

```sql
id                uuid    primary key
appliance_id      uuid    references appliances(id)   -- null = unidentified
started_at        timestamptz not null
ended_at          timestamptz
peak_watts        numeric
delta_on_w        numeric
energy_kwh        numeric
confidence        numeric               -- 0.0 – 1.0
method            text                  -- how it was identified, e.g. "rule_match"
```

> `appliance_id = null` is the **Unknown bucket** and must stay.
> [`refined-flow-and-tasks.md` §12](../source/refined-flow-and-tasks.md#12-energy-disaggregation-output) says it directly: don't pretend every watt
> can be assigned.

### `event_confirmations`

The human-in-the-loop answers from [`refined-flow-and-tasks.md` §10](../source/refined-flow-and-tasks.md#10-human-in-the-loop-confirmation). Becomes
labelled training data.

```sql
id                      uuid   primary key
event_id                uuid   references events(id)
confirmed_appliance_id  uuid   references appliances(id)   -- null if "don't know"
answer                  text   -- yes | no | other | unknown
created_at              timestamptz default now()
```

---

## Where the aggregation happens

Worth being precise, because it is easy to assume the data side does all the maths.

- **Data side** turns `readings` into `events` — one row per detected appliance run.
- **Web side** turns `events` into the breakdown — sums kWh per appliance, applies
  the tariff from `household.tariff_config`, computes cost, produces the summary
  the dashboard shows.

**Nothing in the database stores the aggregate.** `/api/breakdown` computes it on
request from `events`.

---

## Before changing this file

Any schema change alters the contract both sides build against. Use the
`db-change` skill, and check:

1. Does it move a table's writer? If so, both sides must agree first.
2. Is every timestamp `timestamptz`, written in UTC? See
   [`../guides/known-pitfalls.md`](../guides/known-pitfalls.md).
3. Does the data side need to be told? See
   [`../guides/data-side-handover.md`](../guides/data-side-handover.md).
