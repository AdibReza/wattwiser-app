# Web API routes

All served by **Next.js route handlers. No FastAPI.** [`website-details.md` §6](../source/website-details.md#6-apis-the-website-needs-before-shelly)
listed these against a FastAPI backend; the paths are kept, the host changed.

## Authentication and access control

**Every route below requires a signed-in session.** Two routes do not:
`/api/auth/*` (Better Auth's own endpoints) and `GET /api/health` (how a deploy
is verified; it reports table names only, never data).

| Situation | Response |
|---|---|
| No session, or an expired one | `401 { "error": "Sign in to continue." }` |
| A valid session, but the id belongs to another household | `404` |

**404, not 403, is deliberate.** A 403 would confirm that the id exists, which
lets a stranger enumerate other households' rows. Because every query is filtered
by `household_id`, another household's id simply matches nothing and falls into
the handler's existing "not found" branch — there is no separate ownership check
to forget.

Handlers start with the guard from `lib/api.ts`:

```ts
const { householdId, response } = await requireApiHousehold();
if (response) return response;
```

### Auth

```
POST   /api/auth/sign-up/email      body: { email, password, name }
POST   /api/auth/sign-in/email      body: { email, password }
POST   /api/auth/sign-out
GET    /api/auth/get-session
```

Served by Better Auth through `app/api/auth/[...all]/route.ts`. Screens call
`lib/auth-client.ts` rather than these paths directly. Errors come back as
`{ message, code }`; `lib/validation/auth.ts` turns the codes into plain
sentences. Sign-in gives the same message for a wrong password and an unknown
address, so the endpoint cannot be used to discover who has an account.

## Route list

### Household

```
GET    /api/household
PUT    /api/household
```

### Appliances

```
GET    /api/appliances                    → list with calibration status
POST   /api/appliances
GET    /api/appliances/:id
PATCH  /api/appliances/:id
DELETE /api/appliances/:id
GET    /api/appliances/:id/calibrations
```

### Calibration

```
POST   /api/calibration/start             body: { applianceId }
                                          → { sessionId, startedAt }
GET    /api/calibration/:id               → session detail + status
POST   /api/calibration/:id/finish        → { sessionId, endedAt, status }
POST   /api/calibration/:id/discard
```

### Readings

```
GET    /api/readings/current              → { watts, ts, deviceConnected }
GET    /api/readings?from=&to=            → array for charting
GET    /api/readings/energy?from=&to=     → { kwh } integrated over the readings
```

### Demo controls (not part of the product API)

```
GET    /api/dev/switches                  → [{ id, label, watts, isOn }]
PATCH  /api/dev/switches/:id              body: { isOn }
GET    /api/dev/demo-data                 → { loaded, loadedAt }
POST   /api/dev/demo-data                 → 201 { appliances, events, readings, kwh }
DELETE /api/dev/demo-data                 → 204
```

Each household has its own four simulated switches, created the first time it
opens `/dev`.

`POST /api/dev/demo-data` loads 30 days of demo data into the signed-in
household — about 44,000 readings, so the route sets `maxDuration = 60`. It is
`409` if that household already has demo data. `DELETE` removes it again: every
tagged row (`5eed0000-…`) plus the readings inside the recorded window, leaving
the household profile and anything added by hand alone. **A new account is never
seeded automatically** — someone has to ask for it.

### Events and breakdown

```
GET    /api/events?from=&to=              detected runs in a window
GET    /api/events?needsConfirmation=1    the confirmation queue
POST   /api/events/:id/confirm            body: { answer, applianceId? }
GET    /api/breakdown?month=2026-09       → per-appliance aggregation + cost
```

---

## Response shapes

### `GET /api/household`

`null` before the setup form has been saved (the row exists from signup; a null
`label` is what "not set up yet" means), otherwise:

```json
{
  "id": "...",
  "label": "12 Smith St",
  "occupants": 3,
  "homeType": "house",
  "hotWater": "electric",
  "heating": "reverse_cycle_ac",
  "cooling": "split_ac",
  "hasSolar": true,
  "hasBattery": false,
  "hasEv": false,
  "tariff": { "tariffType": "flat", "rate": 0.30 },
  "createdAt": "2026-09-12T02:10:00.000Z",
  "updatedAt": null
}
```

`PUT /api/household` takes the same object without `id` / `createdAt` /
`updatedAt`, creates the row if none exists, otherwise updates it. Bad input →
`400 { "error": "Some fields need attention.", "fields": { "occupants": "At least 1 person" } }`.
`tariff.tariffType` selects which rate fields are required (see
[`data-contract.md`](./data-contract.md#household)).

### `GET /api/appliances`

```json
[
  {
    "id": "...",
    "name": "Kettle",
    "category": "Kitchen",
    "applianceClass": "simple",
    "ratedWatts": 2200,
    "calibrationCount": 3,
    "isCalibrated": true
  }
]
```

`POST /api/appliances` and `PATCH /api/appliances/:id` take
`{ name, category, applianceClass, ratedWatts?, brandModel?, commonSettings?, notes? }`
(`category` one of Kitchen | Laundry | Heating & cooling | Hot water |
Entertainment | Other; `applianceClass` simple | multi_stage | variable_load).
`POST` returns 201. `DELETE` returns 204; its calibration runs go with it.
`GET /api/appliances/:id` returns the summary fields plus `brandModel`,
`commonSettings`, `notes`, `createdAt`.

### `GET /api/appliances/:id/calibrations`

```json
[
  { "id": "...", "startedAt": "2026-09-12T02:10:00.000Z", "endedAt": "2026-09-12T02:14:20.000Z", "status": "completed", "durationS": 260 }
]
```

Newest first. `endedAt` and `durationS` are `null` while `status` is `running`.

### `GET /api/calibration/:id`

```json
{
  "id": "...",
  "applianceId": "...",
  "startedAt": "2026-09-12T05:35:47.711Z",
  "endedAt": "2026-09-12T05:38:12.004Z",
  "status": "completed",
  "baselineW": 352,
  "durationS": 144
}
```

`POST /api/calibration/start` takes `{ applianceId, baselineW }` and returns
`201` with the same shape plus `sessionId`. **It first marks any still-running
session for that appliance as `discarded`** (a tab closed mid-run), so one
appliance never has two running rows. `finish` and `discard` only act on a
`running` session; calling them again returns the row unchanged.

### `GET /api/readings/current`

```json
{ "watts": 2634, "ts": "2026-09-12T05:40:12.114Z", "deviceConnected": true }
```

`GET /api/readings?from=&to=` returns `[{ "ts": "...", "watts": 412 }, …]`
oldest first; defaults to the last 60 seconds, at most 24 hours per call.

`GET /api/readings/energy?from=&to=` returns `{ "kwh": 2.41, "from": "...", "to": "..." }`,
the energy between the two instants by integrating the readings. The browser
passes its own local midnight as `from` for "Today's energy" — the wire stays
UTC, the meaning of "today" is a display decision.

### `GET /api/events?needsConfirmation=1`

The `/confirm` queue: runs that **were matched to an appliance** but with
`confidence < 0.5`, and that nobody has answered yet. Newest first, 25 max.
Unmatched runs (`appliance_id is null`) are deliberately **not** asked about —
there is no guess to confirm.

```json
[
  { "id": "…", "applianceId": "…", "applianceName": "Air conditioner",
    "startedAt": "2026-09-11T04:29:14.892Z", "endedAt": "2026-09-11T05:19:08.976Z",
    "watts": 1090, "energyKwh": 0.946, "durationS": 2994 }
]
```

`watts` is `delta_on_w` (the step this appliance added), falling back to
`peak_watts`.

### `POST /api/events/:id/confirm`

Body `{ answer, applianceId? }` where `answer` is `yes | no | other | unknown`.
Writes exactly one `event_confirmations` row and returns `201`.

| `answer` | means | `confirmed_appliance_id` |
|---|---|---|
| `yes` | the guess was right | the guessed appliance (filled in server-side) |
| `no` | the guess was wrong | null |
| `other` | it was a different appliance | the one supplied — **required**, else 400 |
| `unknown` | the person does not know | null |

`404` if the event does not exist. **`409` if that event already has an answer**
— one answer per event, never silently overwritten.

### `GET /api/breakdown`

`?month=2026-09` (defaults to the current month). Computed on request from
`events`; nothing stores the aggregate.

```json
{
  "month": "2026-09",
  "totalKwh": 52.5,
  "totalCost": 15.74,
  "identifiedPercent": 72,
  "items": [
    { "applianceId": "…", "appliance": "Air conditioner", "kwh": 19.9, "percent": 37.9, "cost": 5.97, "confidence": "medium", "runs": 8, "lastRunAt": "2026-09-11T04:29:14.892Z" },
    { "applianceId": null, "appliance": "Unknown / Other", "kwh": 14.8, "percent": 28.2, "cost": 4.45, "confidence": null, "runs": 25, "lastRunAt": "2026-09-11T01:32:51.298Z" }
  ],
  "recent": [{ "id": "…", "appliance": "Kettle", "applianceId": "…", "startedAt": "…", "endedAt": "…", "kwh": 0.11 }],
  "tariffLabel": "Flat rate, $0.30/kWh",
  "availableMonths": ["2026-09", "2026-08"]
}
```

Biggest first, **Unknown / Other always last and always present** even at 0 kWh.
`confidence` is `"high" | "medium" | "low" | null` — never the stored decimal.
`cost` and `totalCost` are `null` when the household has no tariff yet; the
screen shows energy anyway and says why the cost is missing.

**How cost is worked out** (`lib/tariff.ts`, checked by `lib/tariff.check.ts`):

| Tariff | Rule |
|---|---|
| `flat` | kWh × rate |
| `time_of_use` | each run's energy is split by how much of it falls in **peak, weekdays 3pm–9pm local** |
| `tiered` | tiers apply to the household's monthly total, so every row is charged the month's blended rate |

The **Unknown / Other** row is always present, and its `confidence` is `null` —
not a value. See [`data-contract.md`](./data-contract.md#events).

---

## Conventions

- **Database columns are `snake_case`; JSON fields are `camelCase`.** The mapping
  happens in the route handler — `appliance_class` in SQL, `applianceClass` on
  the wire.
- **Every timestamp on the wire is UTC ISO-8601.** Convert to local time only in
  the browser, at the display layer.
- `/api/breakdown` **computes on request** from `events`. Nothing in the database
  stores the aggregate.
- `deviceConnected` is derived from `devices.last_seen_at` — null or stale means
  Not Connected.
- Confidence reaches the user as **High / Medium / Low**, never as a decimal, even
  though `events.confidence` is stored as `0.0–1.0`.
