# Handover to the data side

The web side owns the contract and **proactively drives this connection**. Do not
wait for the data side to ask.

---

## What to send, in one message

1. **The connection string** — through a private channel, never a group chat.
   Create a **separate database role** for the data side rather than sharing the
   web side's credentials. Grant it:
   - write on `readings`, `events`, `appliance_signatures`
   - read-only on `household`, `appliances`, `calibration_sessions`

2. **[`../specs/data-contract.md`](../specs/data-contract.md), in full.**

3. **The boundary, stated plainly:** the two services never call each other; they
   meet only at this database.

4. **The calibration trigger:** when a new row appears in `calibration_sessions`
   with `status = completed`, that is the cue to slice `readings` between
   `started_at` and `ended_at` and write the result to `appliance_signatures`.

5. **The scope note:** this MVP is **rule-based edge detection plus threshold
   matching** against calibrated signatures. The ML approaches listed in
   [`refined-flow-and-tasks.md` §9](../source/refined-flow-and-tasks.md#9-existing-nilm-models) are future roadmap, not this build.

6. **The UTC requirement**, and a request to confirm the ingest pipeline writes
   UTC.

> Ask that the whole message be given to whatever AI coding assistant the data
> side uses, so both sides work from the same boundaries.

---

## Proving the connection works

**A green deployment proves nothing about whether the two sides agree on the
data.** Run this once, both sides watching.

### Direction 1 — web side acts

Run the calibration wizard once. The data side should see a new
`calibration_sessions` row with `started_at` and `ended_at`.

| What they see | What it means |
|---|---|
| Nothing at all | Wrong connection string, or wrong project. |
| The row, timestamps shifted by hours | A UTC bug. **Fix before continuing** — see [`known-pitfalls.md`](./known-pitfalls.md). |
| The row, timestamps correct | Direction 1 works. |

### Direction 2 — data side acts

Insert one test row into `events`. It should appear on the web side's breakdown
or events view.

**Only when both directions work is the connection proven.**

---

## After the pipeline is live

The web side currently seeds `readings`, `events` and `appliance_signatures` with
mock rows. Once the data side is genuinely writing them:

1. Delete the seeded rows — see [`../specs/mock-data.md`](../specs/mock-data.md).
2. Stop the web side writing those three tables at all.
3. The data side is then the **only** writer, as
   [`../specs/data-contract.md`](../specs/data-contract.md#write-ownership)
   specifies.
