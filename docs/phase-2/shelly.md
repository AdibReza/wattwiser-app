# The meter — mocked, by design

> **Status: LATER — not part of the current POC.** The POC does not stream a live
> mock meter. It loads a pre-computed demo file ([`plan.md`](./plan.md) steps
> 6–7). §2 (the answer key) and §3 (unseen homes only) **do** apply to the POC.

**This is a proof of concept. There is no physical Shelly, and there will not be
one.** The meter is a **replay simulator**. It takes a real home from the public
datasets and sends its whole-house readings to the service, as a Shelly would.

---

## 1. How the mock meter works

1. Pick a home from the public data (see [`ml.md` §2](./ml.md#2-data)).
2. The simulator reads its whole-house power, in time order.
3. Every ~10 s of simulated time, it posts a batch to `/api/ingest` with the
   device token. This is the same endpoint and format a real Shelly would use,
   so the service cannot tell the difference.
4. It can run in **real time** (for a live demo) or **fast-forward** (a month in
   minutes, to fill the breakdown screen).

Timestamps are shifted onto the present so the dashboard reads naturally, and
written in UTC.

## 2. What the replay gives us for free

- **Clean, known data.** No Wi-Fi gaps, no clock drift, and a sample rate we
  choose.
- **The answer key.** Public homes also recorded each appliance on its own meter.
  The app can therefore show what the AI predicted **next to what actually
  happened**, for example:

  > Kettle this month: AI **8.2 kWh**, actual **7.9 kWh**.

  That lets anyone judge the AI with their own eyes. It is the strongest possible
  POC demo. The answer key is used **only for display and scoring**, never as an
  input to the AI.

## 3. Rules for the replay

| Rule | Why |
|---|---|
| Replay only **unseen** homes (never used for training) | Otherwise the demo shows memorised answers, not real skill |
| Keep the home's appliance list in the app matching what the dataset recorded | The AI can only name appliances the household has declared |
| Record which dataset and home each demo household replays | So every number on screen can be traced back |
