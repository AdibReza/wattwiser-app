# Web API routes

All served by **Next.js route handlers. No FastAPI.** [`website-details.md` §6](../source/website-details.md#6-apis-the-website-needs-before-shelly)
listed these against a FastAPI backend; the paths are kept, the host changed.

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
```

### Demo controls (not part of the product API)

```
GET    /api/dev/switches                  → [{ id, label, watts, isOn }]
PATCH  /api/dev/switches/:id              body: { isOn }
```

### Events and breakdown

```
GET    /api/events?from=&to=
POST   /api/events/:id/confirm            body: { answer, applianceId? }
GET    /api/breakdown?month=2026-09       → per-appliance aggregation + cost
```

---

## Response shapes

### `GET /api/household`

`null` before first setup, otherwise:

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

### `GET /api/readings/current`

```json
{ "watts": 2634, "ts": "2026-09-12T05:40:12.114Z", "deviceConnected": true }
```

`GET /api/readings?from=&to=` returns `[{ "ts": "...", "watts": 412 }, …]`
oldest first; defaults to the last 60 seconds, at most 24 hours per call.

### `GET /api/breakdown`

```json
{
  "month": "2026-09",
  "totalKwh": 500,
  "items": [
    { "appliance": "Air conditioning", "kwh": 150.0, "percent": 30.0, "cost": 0, "confidence": "medium" },
    { "appliance": "Hot water",        "kwh": 100.0, "percent": 20.0, "cost": 0, "confidence": "medium" },
    { "appliance": "Kettle",           "kwh": 12.0,  "percent": 2.4,  "cost": 0, "confidence": "high" },
    { "appliance": "Unknown / Other",  "kwh": 128.0, "percent": 25.6, "cost": 0, "confidence": null }
  ]
}
```

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
