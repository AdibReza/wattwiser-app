---
name: db-change
description: Add or alter a table, column, index, or seed in the Supabase database. Use for any schema change, migration, or seed-data work — including when a new screen or API route needs a field that does not exist yet. Protects the two-sided write-ownership contract.
---

# Change the database

The database is **the entire integration surface between the two sides**. A
change here is a change to a contract another team builds against, so it costs
more than a normal code change.

Read `docs/specs/data-contract.md` before touching anything.

## Check these five things first

**1. Does the web side own this table?**

| Web side writes | Data side writes |
|---|---|
| `household`, `devices`, `appliances`, `calibration_sessions`, `event_confirmations` | `appliance_signatures`, `readings`, `events` |

**Only one side writes each table.** If you are adding a write to a data-side
table, stop — unless it is clearly labelled temporary MVP seed data.

**2. Is the change actually needed?**
An extra column is easy to add and hard to remove. If a screen can be built from
what exists, build it from what exists.

**3. Is every timestamp `timestamptz`, stored in UTC?**
No `timestamp without time zone`. No local time. Ever. See
`docs/guides/known-pitfalls.md` — this is the failure that produces silently
wrong calibration data with no error.

**4. Will it need an index?**
Anything queried by time range needs one. `readings` grows at ~2.6M rows/month.

**5. Does the data side need to be told?**
If the change touches a shared table, it must be communicated — see
`docs/guides/data-side-handover.md`.

## Naming conventions

- Tables and columns: `snake_case`, tables plural (`appliances`,
  `calibration_sessions`).
- Enum-ish text columns: lowercase with underscores (`multi_stage`, `time_of_use`)
  — comment the allowed values inline, as the existing schema does.
- Foreign keys: `<table_singular>_id`.
- JSON on the wire is `camelCase`; the route handler does the mapping.

## Making the change

1. Write the migration.
2. Apply it to Supabase.
3. **Update `docs/specs/data-contract.md` in the same change.** The doc is the
   published contract — a schema that has drifted from it is worse than no doc.
4. Update `docs/specs/api-routes.md` if a response shape changed.

## Seed data

The web side seeds `readings`, `events` and `appliance_signatures` for this MVP
only. See `docs/specs/mock-data.md`.

- **Keep every seed removable in one step.** Tag or namespace seeded rows.
- **Include `events` rows with `appliance_id = null`** — the Unknown bucket.
- **Vary confidence** across high / medium / low so the UI handles all three.
- All timestamps UTC.

## When you are done

Run the `ship-a-change` skill, and check the live URL — a screen that works
locally and is empty in production usually means Vercel is pointed at a different
database or is missing an environment variable.
