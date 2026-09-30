# Research findings — `watt-wiser-research`

A summary of the separate NILM research repo, kept here as **reference context**.
It does not change any locked decision in [`../CLAUDE.md`](../CLAUDE.md).

| | |
|---|---|
| Repo | `github.com/vlozg/watt-wiser-research` (local: `../watt-wiser-research`) |
| Snapshot | commit `8f2de97`, 2026-09-25, 42 commits, one author |
| Stack | Python research only (uv, marimo notebooks) — **not an app**, nothing to deploy |
| Summarised | 2026-09-30 |

⚠️ **Trust level.** Most commits and documents in that repo are labelled *"AI work,
not verified / not reviewed yet"*. All 14 hypotheses (H01–H14) are still in the
**"AI drafted"** status, which means the project owner has not approved any of them.
Numbers from its `deprecated/` folder are marked "quarantined" and are upper bounds,
not evidence. Use this page to understand **direction**. Do not quote its numbers as fact.

---

## 1. What the research is

An independent technical review of the original brief, the client's first repo
(`AdibReza/WattWiser`) and the calibration document. The review then tested the
approach on six public datasets: UK-DALE, REFIT, REDD, ECO, GREEND and AMPds2.
Together they cover 46 households and more than 2.2 billion rows.

Where to start in that repo: `docs/START_HERE.md`. After that, read
`docs/PROBLEM_STATEMENTS.md` and `docs/product/feasibility-verdicts.md`.

## 2. Headline conclusions

1. **A narrow product is feasible:** recognise a few large appliances per home,
   with calibration done separately for each home.
2. **Whole-home disaggregation on the Shelly EM Gen3 is not feasible.** The limit is
   the meter's sampling, not the algorithm.
3. **Kettle and fridge class** appliances are detectable after a few minutes of
   calibration. **Washing machine and dishwasher class** appliances do not stand out
   from background noise at this sampling rate. The research calls this a hardware
   and representation limit, not a tuning problem.
4. **Signatures do not transfer well between homes.** Calibrating each home
   separately is necessary (H09). Only the kettle partly transferred across houses.
5. The best-funded consumer product that attempted disaggregation eventually left
   the market. Cross-house generalisation is still unsolved in the field.

## 3. The hardware question — the number everything depends on

The "1 Hz" figure (one reading per second) is **not** a Shelly EM Gen3
specification. It comes from Pro 3EM users on a forum.

| Quantity | Documented value |
|---|---|
| Onboard stored log | **1 minute** resolution, at least 10 days |
| EMData energy export | 300 / 900 / 1800 / 3600 s |
| Live push (StatusChange) | "regular interval" — **no number stated** |
| No-load floor | about **30 VA** (below about 30 W nothing is seen) |
| Accuracy | ±5% from 0 to 1 A, 2% from 2 to 50 A |

Trap: the field `a_freq` is **mains frequency** (50 or 60 Hz), not the sample rate.

Why it matters: one-minute averaging smears the step edges that event detection
relies on. A 90-second kettle boil lands across two samples, each at part of its
real height.

Routes to a faster signal, cheapest first:

- **Tier 0:** poll the stock firmware live over MQTT, RPC or WebSocket from an
  always-on collector. This is expected to be roughly 1 Hz, which is 60 times
  finer than the stored log.
  - This is what our data side's MQTT subscriber does.
  - Any gap in the live stream is lost for good, because the one-minute log
    cannot fill it in.
- **Tier 1:** reflash the device with ESPHome. This should give tens of Hz and
  removes the 30 VA gate.
  - The trade-off is losing Shelly Cloud and the factory calibration.
- **Tier 2:** build a purpose-made current-clamp capture circuit. That is an
  electronics project, not a software one.

Faster sampling gives high-rate **power** readings. It does not give waveforms, and
it does not make small loads visible.

**First action for the data side: measure the real live rate.** Log the time of
every message and plot the gaps between them. This one-day check decides how much
of the rest of this page applies.

## 4. Calibration protocol the research settled on (2026-09-20)

1. Collect metadata: name, type, and the power-label values if any. Nameplate
   values are **warn-only hints**, never a pass/fail gate (H07).
2. **Guided session.** The user presses start and stop while the whole-house signal
   is recorded. Each session is a time window on the same aggregate series.
3. **Condition each session:**
   - Measure the local baseline just before switch-on.
   - Measure the ΔPower (power step) at switch-on and switch-off.
   - **Flag** the session if another appliance changed the total during it (H06).
4. **Repeat.** Guidance is **at least 3 valid sessions** per appliance.
5. **Build the profile** from valid sessions only. The profile's exact form is
   deliberately left open.
6. **Detect.** Compare each unseen event with the profiles, take the best score,
   apply a threshold, and return an appliance **or UNKNOWN**.

Further points from the owner review:

- **Button presses are hints, not truth.** Each boundary is snapped to the real
  power step within a search window, so small timing errors cost almost nothing
  (H10).
- **The app can choose the moment.** A "quiet now" indicator based on low recent
  variance and no recent steps tells the user when to calibrate.
- **Not every device has a button.** A fridge needs a **passive mode**: record a
  2–3 hour window and split it into its natural cycles. This is still an open item.
- **Long sessions are almost always contaminated.** Fridges cycle every 10–40
  minutes, so a washer session of 1–2 hours will nearly always overlap another
  appliance (H12).

## 5. Evaluation contract

- Score **episode-level precision / recall / F1** on unseen events. Keep the
  calibration data and test data strictly separate.
- Do not use pointwise accuracy. A detector that always answers "fridge on" looks
  good under it while detecting nothing.
- Always report **energy share** next to the scores.
- The books must close: attributed energy + always-on + UNKNOWN ≈ mains energy.
  Report the size of the UNKNOWN share for each home instead of assuming it.
- Start with **rules**, not ML: set a simple, explainable floor first.

## 6. How this lines up with our web app

### Already aligned

| Research says | Where we have it |
|---|---|
| End the session on the real stop, not a countdown timer | Wizard step 3 — [`specs/screens.md` §5](./specs/screens.md) |
| Profile = baseline + ΔPower on/off + duration + number of runs | `appliance_signatures` — [`specs/data-contract.md`](./specs/data-contract.md) |
| 3+ sessions per appliance | Wizard hard requirement: 3 to 5 runs |
| Check for a quiet moment before calibrating | Contamination guard: less than 50 W variation over 5 s |
| UNKNOWN must stay visible | Breakdown: the `appliance_id = null` row is always shown |
| Per-home calibration, one household per account | Locked decision |

### Worth considering later (roadmap — nothing changed yet)

1. **Recommend a kettle first** in the UI. A kettle gives about 10 clean runs in 10
   minutes. The washing machine is the most expensive way to get the least useful
   data.
2. **Verify the step live.** When the user switches the appliance on, check that
   total power actually rose within a few seconds. If it did not, say so while the
   user is still standing there. The research calls this the cheapest quality
   improvement available.
3. **Mark multi-stage appliances as low confidence.** At a one-minute cadence,
   washer and dishwasher detection is unlikely to work. Only their heater step is
   visible.
4. **Passive calibration for the fridge.** Fridges have no start button, so they
   need the passive mode from §4.
5. **Longer baseline.** A single short baseline can land inside a fridge
   compressor run. A rolling low-percentile baseline is an ablation candidate.
   Belongs to the data side.
6. **A numeric validity rule** for "profile is reliable". Examples are N valid
   sessions and a low spread (CV) of ΔP. The rule must be measured before it is
   frozen. Belongs to the data side.

Items 5–6, and the live-rate measurement in §3, belong to the Python data side. They
fit the existing contract with no schema change.

## 7. Hypothesis index (all "AI drafted")

| ID | One line |
|---|---|
| H01 | A few guided sessions (about 3 valid ones) yield a usable profile |
| H02 | Large bursty appliances (kettle class) are detectable from the aggregate alone |
| H03 | A one-minute cadence materially degrades detection, worst for small loads |
| H04 | Washer and dishwasher class loads are out of reach for threshold and duration rules |
| H05 | Attribution + always-on + UNKNOWN closes the energy books per home |
| H06 | Enough valid sessions survive the interference flag |
| H07 | How much power-label values help (ablation ladder) |
| H08 | Current and power factor separate appliances with the same wattage (needs live Shelly data) |
| H09 | Signatures transfer poorly across homes |
| H10 | Button-press timing error is cheap up to the snap window |
| H11 | Cross-session templates help; drift from the profile flags a failing appliance |
| H12 | How often calibration windows are really contaminated |
| H13 | User marks identify the device; the mark corpus does not exist yet |
| H14 | Multi-state models help washers and dishwashers at native cadence |
