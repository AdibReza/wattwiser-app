# Product brief

## The problem

A household gets one electricity bill and no idea what drove it. Metering every
appliance individually means an electrician, a smart plug per socket, and a cost
nobody will pay.

## The approach — NILM

**Non-Intrusive Load Monitoring.** One sensor at the meter: a Shelly EM Gen3
with a CT clamp, measuring whole-house power roughly once a second. The system
works backwards from that single number to identify which appliances are running,
so the household can see where the bill actually goes.

Working backwards needs two things the sensor cannot supply:

1. **What the household owns** — declared once, in the setup form and the
   appliance inventory. This narrows what the system has to consider. If there
   is no EV and no dryer, neither needs weighing up when explaining a large event.
2. **What each appliance looks like in the data** — learned through guided
   calibration. The user switches one appliance on while nothing else changes,
   and the resulting step in total power becomes that appliance's signature.

That is why **the input UI is the primary MVP goal**, not the dashboard. The
dashboard is what the input UI makes possible.

## The two sides

Two services that **never call each other**. They meet only at a shared
PostgreSQL database (Supabase).

```
  ┌─────────────────────┐                      ┌──────────────────────┐
  │  Web side           │                      │  Data side           │
  │  Next.js on Vercel  │                      │  Python, deployed    │
  │                     │                      │  separately          │
  │  · every screen     │                      │  · MQTT subscriber   │
  │  · every API route  │                      │  · edge detection    │
  │  · owns the schema  │                      │  · event pairing     │
  └──────────┬──────────┘                      └──────────┬───────────┘
             │                                            │
             │         ┌────────────────────────┐         │
             └────────►│  PostgreSQL (Supabase) │◄────────┘
                       │  the only meeting point │
                       └────────────────────────┘
```

**The web side owns the contract.** It defines the schema, publishes it, and
proactively drives the connection with the data side.

**The data side is never a blocker.** Everything it will eventually produce —
`readings`, `events`, `appliance_signatures` — is mocked by the web side first,
so every screen works end to end before the pipeline exists. See
[`specs/mock-data.md`](./specs/mock-data.md).

Exact per-table write ownership is in
[`specs/data-contract.md`](./specs/data-contract.md).

## How the pieces connect

```
Shelly EM Gen3 ──MQTT──► data side ──► readings   (1 value/second, whole house)
                                          │
                            edge detection + pairing
                                          ▼
calibration_sessions ──────────────►  appliance_signatures
  (web side writes one row                 │
   per wizard run)                   threshold matching
                                          ▼
                                       events      (one detected appliance run)
                                          │
                              web side aggregates + applies tariff
                                          ▼
                                     /breakdown    (kWh and cost per appliance)
                                          │
                              user answers "was this your dishwasher?"
                                          ▼
                                  event_confirmations  (labelled data)
```

`calibration_sessions` is **the main output of the web side**. The data side
reads `started_at` / `ended_at`, slices the matching window of `readings`, and
derives a signature from it.

`event_confirmations` has no consumer in this MVP. It exists because it is
labelled training data the data side can use later, and it is nearly free to
collect while a human is already looking at the screen.

## Who this is built for

Two audiences, and they pull in different directions:

- **The household** using the product — needs plain numbers, plain words, and
  never a raw measurement presented as certainty. Confidence is High / Medium /
  Low, never a decimal.
- **The person building it** — has never written code and works by prompting
  Claude Code. Every agent instruction in [`../CLAUDE.md`](../CLAUDE.md) about
  explaining terms, avoiding the terminal, and one verifiable step at a time
  follows from this.
