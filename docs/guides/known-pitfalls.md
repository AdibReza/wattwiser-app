# Known pitfalls

Three things that are easy to get wrong. Each one **fails silently** — no error
message, no red build, just wrong data.

---

## 1. All timestamps in UTC

Store `timestamptz` in UTC everywhere; convert only at the display layer.

**Why it matters more here than in a normal app:** calibration depends entirely
on matching time windows. The data side slices `readings` between a session's
`started_at` and `ended_at`. A timezone mismatch puts that slice in the wrong
place, so the signature is derived from whatever the house happened to be doing
hours earlier. Nothing errors. The signature is just wrong, and every event
matched against it is wrong too.

**Applies to:** the database, every API response, the calibration wizard, the
seed script, and the data side's ingest.

---

## 2. The Shelly clock may drift from the backend clock

**Check this the day the hardware arrives.**

A few seconds of skew means the readings window sliced by `started_at` lands in
the wrong place. Same failure mode as a timezone bug, smaller offset, harder to
spot.

**How to check:** compare a reading's `ts` against the server's own clock at the
moment it arrives. If they disagree by more than a second or two, correct for it
before trusting any calibration.

---

## 3. Verify the real sample rate early

**Do not discover this in the final week.**

The whole edge-detection approach assumes roughly 1-second pushes. If the real
MQTT push frequency turns out to be 5–10 seconds:

- A kettle running 2 minutes is still detected.
- **A microwave running 40 seconds may be missed entirely.**

**How to check:** connect the hardware, log for 10 minutes, count the actual
samples. 600 samples means 1 second. 60 means 10 seconds, and short appliances
are not detectable — which changes what the product can honestly claim.

> Note the distinction from batching. [`refined-flow-and-tasks.md` §6](../source/refined-flow-and-tasks.md#6-data-processing) allows
> readings to be **transmitted in batches** every 5–30 seconds while still being
> sampled once a second. Batching is a transport detail and is fine. A genuine
> 10-second *sample* rate is not. Count samples, not messages.

---

## Also worth remembering

- **Never stack new work on a red build.** See the `ship-a-change` skill.
- **`events.appliance_id = null` is the Unknown bucket** and must stay visible on
  `/breakdown`. Don't pretend every watt can be assigned.
- **`rated_watts` is not an identifier.** It narrows the candidate set; the real
  figures come from calibration.
- **Never send raw readings to a language model.** Code does the maths; generated
  text only writes the words, from a short numeric summary — and the result is
  cached.
- **`readings` grows at 2.6M rows/month.** Keep 1-second raw for 30 days, then
  roll up to 1-minute averages. No free tier survives keeping it forever.
