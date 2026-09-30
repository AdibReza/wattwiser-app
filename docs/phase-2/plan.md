# Phase 2 plan — AI proof of concept

> **Agents: read this file first for any Phase 2 work.** It holds the goal, the
> decisions already made (do not re-litigate them), the steps, and the current
> state.
>
> **Nothing starts until the owner says so.** Do one step at a time. When a step
> is done, update the [Current state](#7-current-state) table. Commit only when
> the owner asks.

Last updated: 2026-09-30.

---

## 1. Context

- **The owner** builds this alone with Claude Code and is **not a developer**.
  - Explain in plain Vietnamese; code and commits stay in English.
  - See [`../../CLAUDE.md`](../../CLAUDE.md), "Who you are helping".
- **Phase 1 is done.**
  - The web app is live at wattwiser.vercel.app.
  - Every screen works on generated mock data ([`../build-order.md`](../build-order.md)).
- **Phase 2 is a proof of concept (POC)** for a **non-technical customer**. It must
  show that AI can estimate each appliance's electricity from one whole-house
  number.
- **There is no physical meter, and there never will be.** Whole-house readings
  come from **public datasets** of real homes.
- **Time is short**, so the scope below is deliberately minimal. Everything else is
  listed under [Later](#6-later--not-in-this-poc).

## 2. The problem, in one paragraph

**Input to the AI:** the whole-house power of one home over time.

**Output:** for each appliance kind (kettle, microwave, fridge, washing machine,
dishwasher), when it ran and how many kWh it used. Anything the AI cannot
attribute stays **Unknown**.

**Training data:** public datasets that recorded the whole house **and** each
appliance on its own meter. The per-appliance meters are the answer key.

**Web input and Supabase data are not training data**, because they have no
answer key. They are used when the AI runs:

- the appliance list decides which kinds a home can have;
- names label the results;
- the tariff turns kWh into money.

Background: [`../research-findings.md`](../research-findings.md).

## 3. The demo we are building

A live link where a demo household shows, for each appliance, **the kWh and cost
the AI estimated, next to the actual kWh** from the dataset's answer key.

- The demo home is one **the AI never trained on**, so the result is real skill,
  not memory.
- The customer judges accuracy with their own eyes. We do **not** promise a
  percentage.

## 4. Decisions — do not re-litigate

| Decision | Detail and reason |
|---|---|
| **"Real AI, run ahead of time"** | The model is trained **and run** on the Mac over the demo home's recorded data. Its results are packaged into a demo file that the web app loads. The readings are historical, so running the model live adds risk without changing what the viewer sees |
| **No Python service on Vercel** (for this POC) | [`service.md`](./service.md) describes it for later |
| **No live mock meter** (for this POC) | [`shelly.md`](./shelly.md) describes it for later |
| **Training code lives in `ml/` in this repo** | Not a new repo. `ml/` is never deployed. Python via **uv**, pinned in `mise.toml` |
| **Data stays outside git** | About 11 GB on the Mac only. `ml/` reads it through one setting, `WATTWISER_DATA_DIR` |
| **Train on the Mac** | Apple M3 Max, 36 GB, PyTorch on `mps`. Plug in the charger. Do not let the Mac sleep. Save checkpoints so an interrupted run can resume |
| **Research code: run it, never copy it** | `../watt-wiser-research` is marked *"All rights reserved"*. We may **run** its download scripts and **read** its docs. `ml/` code is written fresh. Describing a published architecture's settings is fine |
| **Model = the known baseline** | One small dilated-CNN network per appliance kind, trained across homes ([step 4](#step-4--train)). It has a measured result, so it is low-risk. No architecture experiments in this POC |
| **Five appliance kinds only** | kettle, microwave, fridge, washing_machine, dishwasher. Anything else (air conditioner, water heater…) is **Unknown** and is shown as "not yet supported" |
| **Honest accuracy** | Expect the kettle to be good (about 0.7 cycle F1 on unseen homes in the research) and the others moderate to weak. Show the real numbers |

## 5. Steps

Each step has a **done-when**. Verify it before moving on.

### Step 1 — Get the data

- Use the research repo at `../watt-wiser-research`, branch
  `wattwiser-autoresearch` (already checked out at `67832b7`).
- There, run `uv sync`, then run its
  `src/pipelines/00_download_dataset/download_fnd_gdrive.py` for **`ukdale eco
  refit`** only.
  - These are the **processed** Parquet zips on Google Drive, about 11 GB.
  - The ~47 GB "RAW" layer is **not** needed.
  - Instructions: that folder's `README.md`.
- Output lands in `../watt-wiser-research/data/fnd/`. Point `WATTWISER_DATA_DIR`
  there.
- The Parquet layout is described in the research repo's
  `docs/datasets/parquet-foundations.md`.
- **Done when:** the three dataset folders exist and the research repo's
  `src/pipelines/01_extract_dataset/qa_fnd.py` reports them healthy.
- **Shortcut (optional):** the research author already has trained networks and
  per-home predictions (`data/results/method_compare/`, gitignored there). If
  they agree in writing to share them, steps 3–5 shrink to loading those files.
  Ask the owner before relying on this.

### Step 2 — Set up `ml/`

- Create `ml/` as a uv project (Python 3.13; add `python` and `uv` to
  `mise.toml`). Dependencies: torch, numpy, pandas, pyarrow.
- Add `ml/runs/` and any data paths to `.gitignore`.
- Exclude `ml/` from the web build: add an ignore rule so Vercel does not upload
  it, and keep the web build green.
- **Done when:** a smoke script loads one home's whole-house and appliance series
  from `WATTWISER_DATA_DIR` and prints its date range and sample count.

### Step 3 — Choose homes

- **Training homes:** the research's 20 development homes, listed in
  `../watt-wiser-research/.auto/pool_v4.json` → `pool_houses`.
- **Demo home:** one of its `holdout` homes (never trained on). Pick the one with
  the most of the five appliance kinds present and at least 30 clean days.
  - Candidates: `ukdale/house_5`, `refit/house_2`, `refit/house_3`,
    `refit/house_5`, `refit/house_9`, `refit/house_20`.
  - `ukdale/house_2` fails the research's eligibility rules; skip it.
- Split each home in time: the model trains only on each training home's history.
  The demo home is never used for training or tuning.
- **Done when:** the chosen demo home and its 30-day window are written in the
  [Current state](#7-current-state) table below.

### Step 4 — Train

- For each of the five kinds, train one network. Recipe:
  - **Input:** whole-house power resampled to 6 s, windows of 512 samples,
    minus the window's 10th percentile.
  - **Output:** that appliance's watts.
  - **Network:** 1-D CNN with dilated residual blocks.
  - **Training windows:** about 1,500 centred on "appliance on" plus 1,500 random,
    per training home.
  - **Training:** SmoothL1 loss, AdamW at 1e-3.
  - **Stopping:** start at 6 epochs. Keep going while a held-out training home's
    validation loss still improves.
- Log loss per epoch. Save weights to `ml/runs/<run-name>/`.
- **Done when:** five weight files exist and their training logs show the loss
  flattening.

### Step 5 — Score on the demo home

- Run the five networks over the demo home's 30-day window.
- **Post-process:** at every time step, if the appliances' sum exceeds the
  whole-house power, scale them down proportionally. This removes
  "over-attribution". Anything left over is Unknown.
- Turn each appliance's watts into **runs**: on while above its on-threshold, with
  short gaps bridged. Each run has a start, an end and kWh.
- Score against the answer key, per appliance:
  - **cycle F1:** runs matched by start time and similar duration;
  - **daily energy error:** kWh-per-day error divided by the actual.
  - Protocol: [`ml.md` §3](./ml.md#3-evaluation--the-scoreboard).
- **Done when:** a small table of per-appliance scores is saved in
  `ml/runs/<run-name>/scores.json` and copied into [Current state](#7-current-state).

### Step 6 — Export the demo file

- Write one file (for example `data/demo/ai-home.json`, a few MB at most) with:
  - **readings:** the demo home's whole-house power at **1-minute** averages over
    the 30 days (about 43k points; same step as today's mock seed);
  - **AI events:** one per predicted run — kind, start, end, kWh,
    method `"seq2seq-v1"`;
  - **actual events:** one per real run from the answer key — kind, start, end,
    kWh, method `"actual"`;
  - **scores:** from step 5;
  - **source:** which dataset, home and dates it came from.
- Timestamps are shifted so the 30 days end "today", and stored in **UTC**.
- **Done when:** the file exists. The AI total kWh plus Unknown roughly equals the
  whole-house kWh, and no AI kWh exceeds the whole-house kWh for any day.

### Step 7 — Web: load the demo home and compare

Use the project skills: `new-screen`, `db-change` (only if a column is truly
needed), then `design-review` and `ship-a-change`.

- **`/dev` → a "Load AI demo home" button**, next to the existing "Load demo
  data". It creates the five appliances (named by kind) and loads the demo file's
  readings and events for the signed-in household.
  - Reuse the pattern in `lib/mock/demo-data.ts`: rows tagged `5eed0000-…`,
    readings removed by the `household.demo_loaded_at` window, and clearing
    removes exactly what was added.
- **`/breakdown`:**
  - AI numbers come from events whose method is **not** `"actual"`.
  - When `"actual"` events exist, show **"Actual"** beside each appliance's AI
    kWh.
  - Where the AI and actual differ, keep the wording neutral.
  - The Unknown row stays.
  - Check `lib/db/queries/breakdown.ts` and `lib/breakdown.ts`. Today they do not
    filter by method.
- No new table is expected: `events.method` already exists
  ([`../specs/data-contract.md`](../specs/data-contract.md)).
- **Done when:** on localhost, loading the AI demo home fills the dashboard chart
  and the breakdown shows AI next to Actual for the five appliances.

### Step 8 — Ship and check

- Follow the `ship-a-change` loop: commit (when the owner asks) → push → green
  Vercel build → load the AI demo home on the live URL → check the breakdown.
- **Done when:** the live link shows the demo, ready to send to the customer.

## 6. Later — not in this POC

Kept because the design is sound. **Do not start them** without the owner:

- The Python service on Vercel with `/api/ingest` and live detection
  ([`service.md`](./service.md)).
- A live mock meter streaming a home in real time ([`shelly.md`](./shelly.md)).
- Model improvements: a 2-hour view, a shared backbone, synthetic mixing, other
  architectures ([`ml.md` §5](./ml.md#5-model-roadmap)).
- Personalising the model from calibration runs.
- An `appliances.kind` column and a "kind" field on the add-appliance form, for
  real households.
- More appliance kinds (air conditioner, water heater).

## 7. Current state

| Step | Status | Notes |
|---|---|---|
| 1 Get the data | not started | Research repo is on branch `wattwiser-autoresearch` @ `67832b7`; no data downloaded yet |
| 2 Set up `ml/` | not started | |
| 3 Choose homes | not started | Demo home: — |
| 4 Train | not started | |
| 5 Score | not started | Scores: — |
| 6 Export demo file | not started | |
| 7 Web | not started | |
| 8 Ship | not started | |

Open questions for the owner:

- Ask the research author to share trained networks and predictions (the step 1
  shortcut)?
