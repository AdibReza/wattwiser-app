# Research findings — `watt-wiser-research`

A summary of the separate NILM research repo, kept here as **reference context**.
It does not change any locked decision in [`../CLAUDE.md`](../CLAUDE.md).

| | |
|---|---|
| Repo | `github.com/vlozg/watt-wiser-research` (local: `../watt-wiser-research`) |
| Snapshot | `main` at `8f2de97` (2026-09-25), plus branch `wattwiser-autoresearch` at `67832b7` (2026-09-29) — see §8 |
| Stack | Python research only (uv, marimo notebooks) — **not an app**, nothing to deploy |
| Summarised | 2026-09-30 |

⚠️ **Trust level.** Most commits and documents in that repo are labelled *"AI work,
not verified / not reviewed yet"*. Of 15 hypotheses, only **H15** (the benchmark fix, §8)
is owner-approved. The other 14 are still **"AI drafted"**, which means the project
owner has not approved them.
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

## 7. Hypothesis index (H01–H14 "AI drafted")

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
| H15 | The first benchmark was broken; the fixed one passes a sanity check — **proved**, owner-approved (§8) |

---

## 8. Update — branch `wattwiser-autoresearch` (2026-09-29)

The research author asked us to pull this branch. It adds 36 commits on top of
`main`. It contains new experiments 02–06 and one head-to-head comparison of every
method tried so far.

### 8.1 The benchmark had to be fixed first (H15, proved)

The first scoring setup was broken.

- The recorded submeter data had many one-sample gaps. These chopped real appliance
  cycles into fragments. For example, it counted about 28,000 fridge "episodes" where
  there were really about 1,300 cycles.
- Because of this, even a **perfect** predictor scored only 0.04 on the fridge.
- The old setup also let the model see submeter data during calibration. A real home
  will never have that data.

The fixed benchmark counts whole appliance cycles. It uses only the whole-house
signal during calibration. A built-in sanity check requires a perfect predictor to
score at least 0.9 on every device, or the run is declared invalid.

Lesson for us: **score whole cycles, never individual readings**. This matches
§5.

### 8.2 The three methods compared (`src/experiments/05_method_compare`)

All three methods see only the whole-house signal. All are scored the same way:
90 days after each home's split point, readings every 6 s, checked against that
home's real per-appliance meters. The test uses 27 homes from UK-DALE, REFIT and
ECO:

- **20 development homes**, which were used for tuning.
- **7 unseen homes**, which were never used for tuning. These give the fair
  comparison.

| Method | Plain meaning | What it learns from |
|---|---|---|
| **rules** | Hand-written rules: power step size, duration and time between cycles | 5 simulated button presses per appliance in that home |
| **fhmm** | Statistical model: each appliance is a hidden on/off switch, and the total is their sum | The same 5 presses |
| **seq2seq** | A small neural network that reads a window of the total and outputs one appliance's watts | Per-appliance meters from **other** homes; needs **no** presses in the new home |
| zero | Always says 0 W | Nothing; the reference line |

**Result on the 7 unseen homes.** F1 is the share of real cycles found without
false alarms, where 1.0 is perfect.

| Method | F1 (all devices) | Notes |
|---|---|---|
| rules | **0.306** | Best overall |
| rules + true thresholds | 0.325 | Cheats slightly: uses a level from the submeter. A real home has no submeter |
| seq2seq | 0.280 | Best on **kettle: 0.733** (rules 0.582). Worst on **microwave: 0.049** (rules 0.153) |
| fhmm | 0.159 | Clearly last. It over-claims, as shown in the chart below |
| Best method per device | 0.353 | Only +0.047 over rules alone |

The rules line is now **closed**. After 106 tuning runs it stopped improving, at
F1 0.366 on the development homes:

| Device | F1 |
|---|---|
| kettle | 0.56 |
| fridge | 0.39 |
| dishwasher | 0.38 |
| microwave | 0.27 |
| washing machine | 0.25 |

The seq2seq network is judged **undertrained and short-sighted**:

- It is small (15k parameters) and was stopped while it was still learning.
- It sees only about 26 minutes at a time, but a washer or dishwasher cycle runs
  1–2 hours.

The next experiment (06, transfer learning) fixes this in steps:

1. See 2 hours at a time.
2. Add synthetic mixed data.
3. Train on more data, until it stops improving.
4. Fine-tune on the home's own button presses.

### 8.3 Reading the daily-energy chart (`02_compare_explore.py`)

The notebook shows one home at a time. Each panel shows one appliance's
**kWh per day** over 90 days:

- grey bars = measured (the truth)
- blue line = rules
- red line = fhmm
- green line = seq2seq

What one example home shows:

| Appliance | What happens |
|---|---|
| **Kettle** | seq2seq follows the bars closely. fhmm spikes to 3–4.5 kWh/day on days that used about 0.5 |
| **Microwave** | True use is near 0. **fhmm claims 2–8 kWh/day every day**, which is pure over-claiming. rules and seq2seq stay near 0 |
| **Fridge** | Truth is about 0.75 kWh/day. seq2seq reads a steady **~1.05** (too high). rules and fhmm read **~0.35** (about half) |
| **Washing machine** | rules shoots up on many days with no wash. fhmm and seq2seq follow the real wash days better |
| **Dishwasher** | fhmm claims 5–17 kWh/day against about 1.5 true. rules is closest |
| Days ~48–52 and ~85–90 | The bars drop to 0 for every device, which is most likely a gap in the recorded data. seq2seq still predicts fridge use there |

The takeaway: **no single method is right for every appliance.** Also, "found the
cycle" (F1) and "got the kWh right" do not move together. The notebook has a
scatter plot of F1 against daily energy error for exactly this reason.

### 8.3b Reading the watt-by-watt view (same notebook, "Home explorer")

This view zooms into a window of a few hours in one home:

- The **top panel** shows the whole-house total (grey), the measured sum of the
  target appliances (black dashed) and each method's combined claim.
- There is **one panel per appliance** below it. The dotted line is the ON
  threshold used for scoring.

In the example window a dishwasher runs one cycle at about 2,200 W. Nothing else is
really on, except the fridge for part of the window.

| Appliance | Truth | rules (blue) | fhmm (red) | seq2seq (green) |
|---|---|---|---|---|
| Dishwasher | ~2,200 W block | Flat **~750 W** that starts well before the cycle | **0** — missed | **~2,100 W, tracks it well** |
| Microwave | 0 | 0 | **~2,900 W for the whole cycle** | 0 |
| Washing machine | 0 | 0 | 0 | **Bump up to ~1,000 W**, above the threshold |
| Fridge | ~75 W during part of the window | 0 | ~55 W early, then 0 | Wanders 0–60 W, not in step with the truth |
| Kettle | 0 | 0 | 0 | 0 |

What it shows:

1. **fhmm gives the right energy to the wrong appliance.** It saw a 2 kW block and
   called it the microwave. This is the mechanism behind its microwave and
   dishwasher over-claims in the daily chart.
2. **seq2seq finds the shape but double-counts.** It runs one separate network per
   appliance, and nothing forces the parts to add up to the meter. So the dishwasher
   net and the washer net can both claim the same heater.
   - A cheap guard for any method: **the appliances' combined claim must never
     exceed the measured total.**
   - Whatever is left over goes to Unknown.
3. **rules gets the watts coarse.** It emits one fitted level per appliance, not the
   measured watts, and its cycle edges can be far off.
4. **Small loads are hard for every method.** No method gets the 75 W fridge right
   while a 2 kW appliance is running.
5. **The "measured" truth has holes.** The dense white stripes in the grey fill, and
   the dashed line dropping to 0 again and again, are most likely the one-sample
   gaps in the submeter data. This is the same defect H15 fixed for scoring. They are
   a recording artifact, not the dishwasher switching on and off.

How to open it: in the research repo, run
`uv run marimo edit src/experiments/05_method_compare/02_compare_explore.py`.

- It needs the results from `01_run_compare.py` first.
- Those results live in `data/results/method_compare/`. That folder is not in git
  and is **not on this machine yet**.
- Producing them requires the six datasets to be downloaded and extracted.

### 8.4 What this means for our web app

- **Show confidence, never exact numbers.** At F1 of about 0.3, per-appliance kWh
  is an estimate. The High / Medium / Low confidence and the always-visible
  **Unknown** row on `/breakdown` are the right design, so keep them.
- **Over-claiming is the worst failure for users.** fhmm's microwave invents kWh the
  household never used, and that energy is taken from the Unknown row. A good
  data-side output errs toward Unknown.
- **The seq2seq result gives a hint for onboarding.** It does reasonably on the
  kettle with **zero** calibration. A future version could show a first estimate
  before the user calibrates anything. This is a roadmap idea only, because it is ML
  and ML is cut from this MVP.
- **Add a sum check wherever we show a breakdown.** The appliances' combined kWh
  must be at most the measured total, with the rest shown as Unknown. The web side
  can enforce this at display time even if the data side over-claims.
- **Nothing changes in our contract.** Whichever method the data side ends up using,
  it still writes to `events` and `appliance_signatures` exactly as defined in
  [`specs/data-contract.md`](./specs/data-contract.md).


### 8.5 The research author's reading and proposed next steps (2026-09-30), checked

The research author summarised the findings in chat. Each claim was checked against
the code (`05_method_compare/compare_lib.py`, `.auto/bench_v4.py`), the dossier
(`.auto/dossier.md` §6) and `06_transfer_dl/backbone_capacity_review.md`.

| Claim | Verdict | Evidence |
|---|---|---|
| seq2seq beats every method on **energy** | **True, narrowly** | Daily energy error: seq2seq 0.650, rules 0.723, fhmm 1.306 (all-zero = 1.0). Total energy error: 0.459 / 0.548 / 0.891. The dossier still says *"no method is product-ready on energy"*. On **cycle F1**, rules still leads (0.306 vs 0.280), and seq2seq's median across unseen pairs is only 0.15, so a few homes carry its mean |
| seq2seq is **undertrained** | **True** | Stopped at a fixed 6 epochs with loss still falling 1–2% per epoch. No validation split, no early stopping |
| Model is small (tens of k parameters) | **True** | 15,073 parameters |
| The bigger limit is **how far it sees** | **Add this** | It sees 25.7 min at a time, against 1–2 h washer and dishwasher cycles. That is why those two collapse on unseen homes (0.33 → 0.13 and 0.34 → 0.19) while the kettle does not. Making it wider without seeing further will not fix them |
| Training data is only 90 days | **Not quite** | 90 days is the **evaluation** span. Training reads each home's pre-split history: 180 days, or the full history. The real limit is sampling: only 1,500 ON-centred + 1,500 random windows per home. The 29-house pretraining pool is unused |
| Trained on UK-DALE | **Not quite** | The 20 development homes are 15 REFIT, 4 ECO and 1 UK-DALE |
| 5 devices = 5 separate models | **True** | One net per device in `stage_train`. This is also why nothing stops the parts adding up to more than the total |
| Transfer learning is the most promising route, but unproven | **Agreed** | Experiment 06: M1 (zero-shot baseline) is measured. M2 (transfer matrix) and M3 (adapt on the 5 presses) have not been run. Only a smoke-run of `01_pretrain.py` exists |

Proposed experiments, with notes from the evidence:

1. **Shared backbone + one head per device, top priority.** A new appliance is then
   handled one of two ways: fine-tune on its calibration samples, or embed a
   calibration sample and predict from that embedding plus the whole-house signal.
   - This is M3 in experiment 06. The embedding route is the one that matters for
     the product, because users will enrol appliances outside the five trained
     ones.
   - The dossier records an earlier failure: full fine-tuning overfit, with about
     11× damage at 40 epochs, and saturated heads. Its prescription is to freeze the
     backbone, tune the head only, and recompute class weights on the calibration
     data.
   - A shared backbone also enables fix 2 in the over-attribution list below.
2. **Bigger model, same data.** Worth doing, but widen **how far it sees** in the
   same step: about 2 h, by adding more dilation levels or a U-Net path. The capacity
   review ranks this first.
3. **New architectures:** DAE, LSTM/BiLSTM, Seq2Point, SGN.
   - **SGN** (Subtask Gated Network) pairs an on/off gate with a watts regressor. It
     outputs 0 when the gate says off, which directly targets the false claims
     seen in §8.3b.
   - Run every architecture through the same 05 harness, with the same homes, seeds
     and scorer.
   - Published rankings are usually measured on **homes the model was trained on**.
     Ours is **unseen homes**, so a paper's winner may not win here.
4. **More training data**, from 180 to 365 days, after steps 1–2.
   - Cheaper levers come first: use every ON window instead of 3,000 per home, add
     the 29-house pretraining pool, and use **synthetic mixing**.
   - Synthetic mixing means pasting one home's appliance traces onto another home's
     total. It is the standard NILM augmentation and teaches overlap directly.

**Over-attribution** means the per-appliance predictions add up to more than the
whole-house total. Options, cheapest first:

1. **Post-processing.** Each time step, if the sum of appliances exceeds the total
   minus the always-on load, scale all appliances down in proportion. The rest goes
   to Unknown. This is guaranteed to work, costs nothing and needs no training. Do
   it now as the floor.
2. **Build it into the model.** With a shared backbone, predict each appliance as a
   **share of the total**, using a softmax over the five appliances plus an
   "other" class. The shares then add to at most 100% by design, instead of being
   patched afterwards.
3. **A gate per device** (as in SGN). This cuts false "on" claims, which are the
   main source of excess.
4. **Measure it.** Add a metric such as *% of time the sum exceeds the total* and
   *excess kWh*. Today's metrics score each appliance alone, so over-attribution
   is invisible in `metrics.csv`.

For the web app nothing changes. The display-time sum check in §8.4 is the same idea
as option 1 and protects the breakdown screen whatever the data side ships.
