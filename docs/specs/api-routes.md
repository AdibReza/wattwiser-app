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

### Events and breakdown

```
GET    /api/events?from=&to=
POST   /api/events/:id/confirm            body: { answer, applianceId? }
GET    /api/breakdown?month=2026-09       → per-appliance aggregation + cost
```

---

## Response shapes

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
