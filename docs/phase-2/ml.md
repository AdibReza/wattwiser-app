# Training the AI — data, evaluation, models, going live

> **Current POC scope** ([`plan.md`](./plan.md)):
> - Data prep (§2), evaluation (§3), deployment parity (§4) and training on the
>   Mac (§6) apply.
> - From the roadmap in §5, **only step B** (the known baseline) applies, plus
>   the sum-scaling post-process.
> - §7 (ONNX, going live in a service) is **later**. In the POC the model's
>   output is exported as a demo file instead (plan step 6).

Everything in `ml/` runs on the Mac (Apple M3 Max, 36 GB). None of it is
deployed. Its only product is a model file that `service/` loads.

Background and the numbers behind every choice here:
[`../research-findings.md`](../research-findings.md).

---

## 1. What "training" means here

We need training data where the answer is known.

- **Public datasets** recorded whole-house power **and** each appliance on its own
  meter at the same time.
- The model sees a window of whole-house power (the question) and learns to
  output each appliance's power (the answer).
- It repeats this over millions of windows until its outputs stop improving on
  homes it has **never seen**.

The result is one file of learned weights. Running that file on new readings
takes well under a second. That step is called *inference*, and it is what the
service does.

## 2. Data

| Dataset | Homes | Cadence | Role |
|---|---|---|---|
| REFIT | 20 | 8 s | Most of the training data |
| UK-DALE | 5 | 6 s | Training + the original benchmark home |
| ECO | 6 | 1 s | Training |

Preparation reuses the research pipeline **by running it, not copying it**. See
[`plan.md` risk 4](./plan.md#risks-in-order-of-damage).

1. In `../watt-wiser-research`, run its download and extract steps, or restore
   the processed layer with its `download_fnd_gdrive.py`.
2. That produces tidy per-home Parquet files under its `data/fnd/`.
3. `ml/` reads them through one setting, `WATTWISER_DATA_DIR`. It never writes
   there.

Storage: REFIT alone is about 6.7 GB extracted. Budget 30 GB. The Mac has
400+ GB free.

**Split by home, never by time alone.** Hold out whole homes for testing. A model
that has seen a home's earlier days is not being tested on generalisation. Use
the research's frozen split: 20 development homes and 7 unseen homes.

## 3. Evaluation — the scoreboard

One harness scores every detector, rules and models alike, so numbers are
comparable. It follows the research's owner-approved protocol (H15), plus one
metric of our own.

| Metric | Plain meaning | Good |
|---|---|---|
| **Cycle F1** | Did we find each real appliance run, without false alarms? Runs are matched by start time within a per-appliance tolerance and similar duration | Higher |
| **Daily energy error** | How far off the kWh-per-day is — what the breakdown screen shows. Always saying 0 scores 1.0 | Lower |
| **Over-attribution** | % of time the appliances' predicted sum exceeds the whole-house total, and the excess kWh | Lower, ideally 0 |

Rules of the scoreboard:

- **Sanity gate.** A perfect predictor must score at least 0.9 per appliance, or
  the harness declares itself broken. This caught a real bug in the research.
- **The unseen homes are read only at milestones.** They are never used to pick
  settings. Tune on development homes only.
- Report per appliance **and** overall. Report the median over homes next to the
  mean: in the research, a few homes carried the mean.
- Every result is saved with the model's name, the data version and the date.

## 4. Deployment parity — what a model may use

A model may only use what a real household gives us:

- whole-house power;
- the appliance list;
- up to 5 calibration runs per appliance.

**Never** a per-appliance meter at run time. Public-data per-appliance meters exist
only to train and to score.

## 5. Model roadmap

Each step must beat the one before it on the scoreboard, or it is dropped.
Details for each step are in
[`../research-findings.md` §8.5](../research-findings.md#85-the-research-authors-reading-and-proposed-next-steps-2026-09-30-checked).

| Step | What | Why |
|---|---|---|
| **A. Floor** | The rule detector from the service, scored | The number every model must beat |
| **B. Reproduce** | One small network per appliance, as in the research. It should reach about 0.28 unseen F1 | Proves our data and harness match the research before we trust new numbers |
| **C. See further** | View about 2 hours instead of 26 minutes, with a wider network, trained until validation stops improving | Washers and dishwashers run 1–2 h. The old net only ever saw fragments |
| **D. One shared model** | One backbone and one small head per appliance kind. Output each appliance as a **share of the total** (softmax over appliances + "other") | Parts can no longer add up to more than the whole. It also sets up step F |
| **E. More and better data** | Every training window, not a sample. **Synthetic mixing**: paste one home's appliance traces onto another home's total | Standard NILM augmentation. It teaches overlap directly |
| **F. Adapt to the home** | Tune only the heads on the household's calibration runs, or condition the model on an embedding of a calibration run | Makes it personal, and later supports appliance kinds the model was never trained on |
| **G. Other architectures** | Seq2Point, BiLSTM, SGN (a gated network that outputs 0 when it judges the appliance off) | Only after C–E, and through the same harness |

The research recorded one failure to design around: fine-tuning the whole network
on a few runs overfit badly. Freeze the backbone and tune the heads only.

## 6. Training on the Mac

- PyTorch with the `mps` device (the Apple GPU). Fall back to CPU if an operation
  is unsupported.
- Fix a seed and record it. Keep 1–2 development homes aside for validation and
  **early stopping**.
- Keep a training log per run: loss per epoch and validation score per epoch.
  If the loss is still falling at the end, it stopped too early.
- Expected size: tens of minutes to a few hours per run. If a run needs more,
  that is the moment to consider a cloud GPU, not before.

## 7. From trained model to live model

1. **Export** to ONNX. It is small, loads fast, and runs on CPU through
   onnxruntime, with no PyTorch in the service.
2. Write the **model card** (`service/models/<name>.json`) with:
   - the appliance kinds it predicts;
   - input cadence (6 s) and window length;
   - the scoreboard results on unseen homes;
   - the data version and the date.
3. **Check parity.** The service's inference on a replayed home must match `ml/`'s
   output on the same home.
4. **Promotion rule.** The model goes live only if, on unseen homes, it:
   - beats the rule floor on **both** cycle F1 and daily energy error;
   - keeps over-attribution at or near 0.
5. **Switch per household**, with rules as the fallback. Keep both methods'
   events comparable through `events.method`.

## 8. Folder layout

```
ml/
  pyproject.toml, uv.lock
  data.py          load a home from WATTWISER_DATA_DIR, resample, split
  harness.py       the scoreboard (§3), sanity gate included
  models/          one file per architecture
  train.py         train one model, log, save weights
  export.py        weights → ONNX + model card → service/models/
  runs/            logs and scores per run (gitignored except summaries)
```
