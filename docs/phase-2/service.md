# The service — build, run, host, connect

> **Status: LATER — not part of the current POC.** The POC runs the AI ahead of
> time on the Mac and loads the results as a demo file. See
> [`plan.md`](./plan.md) §4. Keep this design for when a live service is
> wanted. Do not build it without the owner.

The Python side of WattWiser. It takes readings in and writes signatures and
events out. It lives in `service/` in this repo and deploys as its own Vercel
project.

---

## 1. Where it sits

```
 Shelly (or the replay simulator)
   │  POST /api/ingest   — a batch of readings every ~10 s, with a device token
   ▼
 ┌──────────────────────────────┐            ┌──────────────────────────────┐
 │ wattwiser-service (Python)   │            │ wattwiser (Next.js)          │
 │ Vercel project, root service/│            │ Vercel project, root .       │
 │                              │            │                              │
 │ writes: readings, events,    │            │ writes: household, appliances│
 │   appliance_signatures,      │            │   calibration_sessions,      │
 │   devices.last_seen_at       │            │   event_confirmations        │
 └──────────────┬───────────────┘            └──────────────┬───────────────┘
                │                                           │
                └────────────►  Supabase Postgres  ◄────────┘
                                the only meeting point
```

**The two projects never call each other.** Everything passes through the
database, exactly as in Phase 1. Table-by-table ownership is in
[`../specs/data-contract.md`](../specs/data-contract.md#write-ownership).

## 2. Can Vercel run Python?

Yes. Vercel runs Python functions (3.12–3.14) with no configuration, and FastAPI
apps run natively. Functions may be up to 5 GB and run up to 300 s by default. That
is enough for onnxruntime and a small model.

The "no FastAPI" rule from Phase 1 still holds **for the web side**. The service is
a separate project.

**Why two projects instead of one:**

- The web app stays exactly as it is, with no folder moves.
- A Python mistake cannot turn the web build red.
- Each side rolls back on its own.

The two sides share nothing at runtime, so there is nothing to keep in lock-step.

**Setup, once (at M1):**

1. In the Vercel dashboard, choose *Add New → Project*, import the same GitHub
   repo, and set **Root Directory** to `service`. Name the project
   `wattwiser-service`.
2. On **both** projects, set an *Ignored Build Step* so each project only rebuilds
   when its own folder changes:
   - the web project skips when only `service/` or `ml/` changed;
   - the service project skips when nothing under `service/` changed.
3. Add the database connection string to the service project's environment
   variables, the same way it was added to the web project. It must **never** be
   stored in a file on the Mac.

## 3. Folder layout

```
service/
  pyproject.toml, uv.lock     dependencies (uv)
  app/
    main.py                   FastAPI app: /api/health, /api/ingest
    db.py                     connection + the only SQL in the service
    ingest.py                 validate batch, check token, insert readings
    calibrate.py              completed calibration session → signature
    detect/
      base.py                 Detector interface: readings window → events
      rules.py                edge detection + signature matching (the floor)
      model.py                ONNX model → per-appliance watts → events
    target.py                 refuses a cloud DB URL on localhost (mirror of lib/db/target.ts)
  models/
    <name>.onnx               exported from ml/, committed (small)
    <name>.json               its card: classes, cadence, window, score
  tests/
```

`ml/` sits next to it and is **never deployed**. See [`ml.md`](./ml.md).

## 4. What one ingest call does

There is no cron and no always-on process. The Shelly's push is the heartbeat.
Each call:

1. **Checks the token** against `devices.token_hash`, which gives the
   `household_id`. A wrong token gets 401. An unknown device gets 404.
2. **Inserts the batch into `readings`**, with timestamps in UTC. It updates
   `devices.last_seen_at`.
3. **Processes calibration.** Any `calibration_sessions` row for this household
   that is `completed` and has no signature yet is sliced out of `readings`. Its
   signature is written to `appliance_signatures`.
4. **Runs detection** when a 5-minute boundary has passed since the last run. It
   reads the recent window, runs the household's detector, and writes new
   `events`. Events are **idempotent**: re-running the same window must not
   create duplicates.
5. Returns within a few seconds. The work per call is small by design.

Why no cron: Vercel Hobby cron jobs run at most once a day, which is far too
slow. Tying the work to ingest also means no data arriving equals no work, and a
dead meter costs nothing.

## 5. Detectors

Both detectors implement the same interface, so the rest of the service does not
care which one runs:

```
detect(household, readings_window) → list of events (appliance_id | null, start, end, kWh, confidence, method)
```

| Detector | Uses | Live from |
|---|---|---|
| `rules` | Calibration signatures: power step + duration match | M4 |
| `model` | ONNX model, per-appliance watts → cycles → events | M8 |

The model outputs watts per appliance **kind** (kettle, fridge, and so on). The
service maps each kind to the household's appliance with that `kind`. Anything
unmatched goes to Unknown (`appliance_id = null`).

**Cadence:** the model is trained on 6-second data. The service averages the
Shelly's readings to 6 s before inference. That value is written in the model's
card, never assumed.

## 6. Running it locally

Same rule as the web side: **local development uses the local Supabase only.**
`target.py` refuses to start if the connection string is not local.

- `just up` starts the local Supabase, as before.
- `just service` (added at M1) runs the service on `http://localhost:8000` with
  auto-reload.
- `just replay <home>` (added at M3) replays a public home into the local service.

Each `just` command gets a one-line description, as in the existing `justfile`.

## 7. Security

- The only public endpoints are `/api/health` and `/api/ingest`.
- Device tokens are random, shown **once** when a device is added, and stored
  only as a hash.
- The service's database role writes only the tables it owns
  ([`../specs/data-contract.md`](../specs/data-contract.md#write-ownership)).
  Use a separate role from the web side's.
- Every query filters by the `household_id` taken from the token, never from the
  request body.
