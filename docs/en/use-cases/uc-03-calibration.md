# UC-03 · Teach it an appliance

**Screen:** `/calibration/<appliance id>`
**For:** the household

> 🔴 **This is the most important part of the whole app.** Skip it and every
> other screen is meaningless.

---

## What this screen does

A **5-step** guide that teaches the system to recognise one specific appliance.

### Think of it like a water meter

Your house has **one** water meter out by the street. Looking at it, you can't
tell whether water is going to the washing machine or the shower — only how much
is flowing in total.

But you can do this: turn everything off, watch the meter sit still, then **open
exactly one shower** and see how much faster it spins. From then on, whenever you
see it spin at that rate, you can guess someone's in the shower — even though
you're still only looking at the one meter.

**WattWiser does exactly this, with electricity.** Calibration is that
"open exactly one shower" moment. Without it, the system only sees one total
number and is stuck.

### The same story, in real numbers

|                     | Whole-house power | What it means                                     |
|---------------------|-------------------|---------------------------------------------------|
| House doing nothing | **352 W**         | fridge, router, standby lights — the **baseline** |
| Microwave on        | **1552 W**        | baseline + microwave                              |
| The difference      | **1200 W**        | ← this is what the system needs to learn          |

**1200 W for about 3–5 minutes** is the **"electrical signature"** of your
microwave. From then on, if power suddenly jumps from 380 to 1580 at three in the
afternoon and drops back four minutes later, the system can say: *microwave, ran
for 4 minutes* — with nobody pressing anything.

> 💡 **What does "signature" mean?** Like a handwritten signature: everyone signs
> differently, and you recognise the person by the strokes. Every appliance also
> "signs" the wiring in its own way — how many watts, for how long, how steadily.

### The principle in one sentence

You switch on **one** appliance while **nothing else changes**. The step in power
that appears at that moment is that appliance's tell.

```
Whole-house power
  1552 W ┤              ┌──────────────────┐
         │              │                  │
         │              │  ← 1200 W gap:   │
         │              │    the microwave │
         │              │    signature     │
   352 W ┤──────────────┘                  └────────
         │   baseline (fridge, router, standby)
         └────────────────────────────────────────► time
              ↑ press "It's on"    ↑ press "Done"
```

Each run through the guide produces **exactly one record**, never more.

---

## When to use it

- After adding a new appliance to your list
- When you want the system to recognise it **more accurately** — run it again
- When the appliance is repaired or replaced

### Why it matters

This is the **only** thing that tells the system what an appliance "looks like"
in the data. Without it:

- Every run falls into the **"Unknown / Other"** bucket
- The breakdown screen shows one row: *unknown, 100%*
- The confirmation screen has nothing to ask about — there are no guesses to
  confirm

In short: **without calibration the product does nothing.**

### Why three to five runs per appliance

One run gives the system **one** sample. Several runs tell it:

- What the **usual** power level is, not one lucky reading
- How much the **duration varies**
- For multi-stage appliances: whether the sequence of phases is consistent

Step 5 says so outright: *"Three to five runs gives the best result."*

---

## Steps

### A full example: teaching it your microwave

Each row is **one thing you do** and **the number you'll see**. The whole run
takes about 4 minutes, most of it waiting.

| #   | What you do                                                         | What the screen shows                                                                        |
|-----|---------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| 1   | Switch off anything currently running in the house                  | —                                                                                            |
| 2   | Open **Appliances**, click **Microwave**                            | Appliance page, labelled **Not Calibrated**                                                  |
| 3   | Press **Start calibration**                                         | **Step 1/5**, `Total power right now: 352 W`                                                 |
| 4   | Wait a few seconds, don't touch anything                            | Text turns **green**: *"Steady at about 352 W. Good to go."* **I'm ready** becomes clickable |
| 5   | Press **I'm ready**                                                 | **Step 2/5**, `Baseline captured — 352 W`                                                    |
| 6   | Go to the kitchen and **start the microwave** as you normally would | —                                                                                            |
| 7   | Come back and look at **Live**                                      | `Live: 1552 W` ← up by exactly **1200 W**                                                    |
| 8   | Press **It's on**                                                   | **Step 3/5**, the graph draws the step                                                       |
| 9   | Let it run, don't switch anything else on                           | `Recording for 3m 12s`                                                                       |
| 10  | When it finishes, press **It's finished**                           | **Step 4/5**, `Above the baseline: 1200 W` · *"Still drawing power."*                        |
| 11  | **Switch the microwave off**                                        | —                                                                                            |
| 12  | Look at the difference box again                                    | `Above the baseline: 2 W` · *"Looks like it's off now."*                                     |
| 13  | Press **Done**                                                      | **Step 5/5**, green box `Run saved for Microwave`                                            |
| 14  | Press **I'm done**                                                  | Back to the appliance page                                                                   |
| 15  | Check the list                                                      | Microwave now reads **Calibrated · 1 run**                                                   |

**Result:** the system has learnt that your microwave draws an extra **1200 W**
for about **3 minutes**. That's all a calibration run does.

**Three numbers worth remembering:**

| Number     | Where it came from | What it means                                                 |
|------------|--------------------|---------------------------------------------------------------|
| **352 W**  | step 3             | What the house draws *without* the microwave                  |
| **1552 W** | step 7             | What it draws *with* the microwave                            |
| **1200 W** | 1552 − 352         | What the microwave alone draws ← the only figure that matters |

> 💡 Your numbers will be different — every house has its own baseline, and it
> drifts by a few tens of watts on its own. That's fine; the **difference** is
> what counts.

### Which appliance to do first

- Start with something that **draws a lot and switches cleanly**: kettle,
  microwave, toaster, heater.
- Leave the **air conditioner and fridge** for later — their power moves around
  constantly, so they're harder to learn and need more runs.
- **Washing machines and dishwashers** work fine, but you have to wait out a real
  cycle (45–70 minutes), so pick a time when you're not in a hurry.

> 💡 Trying the demo version with simulated appliances? See
> [UC-07](./uc-07-demo-controls.md) for how to flip fake appliances instead of
> real ones.

The rest of this page explains **each step** in more detail.

---

### Getting into the guide

Two ways in:

1. **Appliances** → click the appliance → **Start calibration** at the top
2. **Dashboard** → **Start calibration** → pick the appliance in the dialog

---

### Step 1 — "Make sure [name] is off."

```
   Step 1 / 5

   Make sure Microwave is off.
   WattWiser needs a few quiet seconds to learn what your
   home draws without it.

   ┌──────────────────────────────────────────────────┐
   │  Total power right now                    352 W  │
   │                                                  │
   │  Steady at about 352 W. Good to go.              │
   └──────────────────────────────────────────────────┘

                                   [ Cancel ]  [ I'm ready ]
```

**This step is a latch on the door.** **I'm ready** stays locked until the
whole-house power agrees to sit still.

Why lock it? Because if someone puts the kettle on at the moment you start the
microwave, the step on the graph will be 1200 + 2200 = **3400 W**, and the system
will be convinced the microwave draws 3400 W. Get it wrong here and it stays
wrong forever, **with no error message.**

**"Sitting still" means:** over **5 seconds in a row**, the highest reading minus
the lowest must be **under 50 W**.

The line under the power box changes with the situation:

| Situation                 | What it says                                                                                       | Colour |
|---------------------------|----------------------------------------------------------------------------------------------------|--------|
| Still gathering readings  | *"Checking that nothing else is switching on… 3 of 5 seconds."*                                    | grey   |
| Something else is running | *"Hold on — something else is running. Power is moving by 180 W; it needs to settle within 50 W."* | amber  |
| Ready                     | *"Steady at about 352 W. Good to go."*                                                             | green  |
| Lost the meter            | *"Can't reach the meter. Check the connection."*                                                   | red    |

**For a Variable load appliance**, there's an extra note:
*"This type of appliance changes its power while running, so it is harder to
identify. Plan on a few extra runs."*

Press **I'm ready** once the line is green.

---

### Step 2 — "Turn [name] on as you normally would."

**This is where the record is opened.** Pressing **I'm ready** in step 1 saved
two things: the **start time** and the **baseline** it just measured.

```
   Step 2 / 5

   Turn Microwave on as you normally would.
   Avoid switching on other appliances for the next 2 minutes.

   ┌──────────────────────────────────────────────────┐
   │  Baseline captured                  [Recording]  │
   │  Your home was drawing 352 W before switching on.│
   └──────────────────────────────────────────────────┘

   Live: 1552 W
                                   [ Cancel ]  [ It's on ]
```

**Now go and switch the appliance on**, exactly the way you always use it — for a
microwave, press start.

Back at the screen, **Live** has jumped from 352 to about **1552 W**. Press
**It's on**.

> 💡 **What is the "baseline"?** It's what your house draws when *nobody is doing
> anything* — the fridge running, the router lit, the standby lights. The
> `Baseline captured` box just recorded that number. Everything from here is
> measured **against** it, not as a total.

#### The wording changes by appliance type

The detail most people miss:

| Type              | Step 2 says                                                   |
|-------------------|---------------------------------------------------------------|
| **Simple**        | *"Turn Microwave on as you normally would."*                  |
| **Multi-stage**   | *"Start a normal cycle now — the one you use most often."*    |
| **Variable load** | *"Turn Air conditioner on and set it as you normally would."* |

> 💡 For a washing machine, "switch it on" isn't enough — you have to **run the
> cycle you actually use most**, because every cycle has a different power shape.

---

### Step 3 — "Recording…"

```
   Step 3 / 5

   Recording…
   Leave it running. Avoid switching on other appliances.

   [Recording]                       Recording for 1m 24s

   ┌──────────────────────────────────────────────────┐
   │  Power while recording                           │
   │       ┌───────────────────────                   │
   │       │                                          │
   │   ────┘                                          │
   └──────────────────────────────────────────────────┘

   Baseline before switching on: 352 W
                              [ Cancel ]  [ It's finished ]
```

The graph draws in real time. The step is unmistakable.

**For Multi-stage appliances**, there's an extra note:
*"A full cycle may take 45–70 minutes. You can leave this page open."*

---

### Step 4 — "Wait for it to finish, then switch it off."

```
   Step 4 / 5

   Wait for it to finish, then switch it off.
   Press Done only once it has switched off, so the recording
   ends where the appliance does.

   [Recording]                       Recording for 3m 12s

   ┌────────────────────────┬─────────────────────────┐
   │  Total power now       │  Above the baseline     │
   │      1552 W            │      1200 W             │
   │                        │  Still drawing power.   │
   └────────────────────────┴─────────────────────────┘

                                   [ Cancel ]  [ Done ]
```

The **Above the baseline** box is a genuinely useful guide:

| Difference | What it says                 |
|------------|------------------------------|
| ≥ 50 W     | *"Still drawing power."*     |
| < 50 W     | *"Looks like it's off now."* |

**Now switch the appliance off.** Look back at the screen — the difference drops
from 1200 W to about 2 W, and the line changes to *"Looks like it's off now"*.

What's it for? So you **don't press Done too early**. Press early and the
recording gets cut short, and the system learns that your microwave only runs for
one minute.

Press **Done**.

**For Multi-stage**, step 4 reads differently:
*"Leave it running to the end of the cycle, then press Done."* with the note
*"This may take 45–70 minutes."*

---

### Step 5 — "Complete"

```
   Step 5 / 5

   Complete
   Run calibration again? Three to five runs gives the best result.

   ┌──────────────────────────────────────────────────┐
   │  Run saved for Microwave              [Complete] │
   │  Recorded for 3m 12s · baseline 352 W            │
   └──────────────────────────────────────────────────┘

   Each run teaches WattWiser a little more about what
   Microwave looks like. You can come back and add runs any time.

                          [ I'm done ]  [ Yes, run again ]
```

- **Yes, run again** → back to step 1 with a **fresh** record
- **I'm done** → back to the appliance page

---

### Stopping halfway

**Cancel** is on every step. From step 2 onwards it opens a dialog:

> **Stop this calibration?**
> This run is discarded. Nothing already saved for Microwave is affected.
> [ Keep going ]  [ Stop and discard ]

That run is marked as discarded. **Anything already saved is untouched.**

---

## When it's done

- A confirmation pops up: **"Calibration saved"**
- In the appliance list, the label goes from **Not Calibrated** →
  **Calibrated · 1 run**
- On the appliance's own page, **Calibration history** has a new row

### What a calibration run actually saves

This is where people get confused: a calibration run does **not** work out the
"1200 W" figure itself. It records exactly **three things**:

1. What time it started
2. What time it ended
3. What the house was drawing before you switched on

Like marking a stretch of a video recording and writing a note in the margin:
*"this bit is the microwave."* Rewinding that stretch and pulling out the 1200 W
figure is a later job — a part that isn't built yet, currently stood in for by
sample data.

**So those three numbers are the most important thing this screen produces.**
Mark the wrong stretch and everything downstream is wrong.

---

## Worth knowing

### ⚠️ One run = exactly one record

Never more. If you close the page halfway and start again, the system
**automatically drops the old run** before opening a new one. An appliance never
has two unfinished runs at once.

### ⚠️ The latch in step 1 is there to protect you

Say you're calibrating the microwave (1200 W) and someone in the house plugs in
the kettle (2200 W):

|              | The system sees   | The system concludes          |
|--------------|-------------------|-------------------------------|
| Should be    | a 1200 W jump     | microwave draws 1200 W ✅     |
| Contaminated | a **3400 W** jump | microwave draws **3400 W** ❌ |

From then on, every time someone uses the microwave, the system looks for a
3400 W step — never finds one — and files them all under *"Unknown"*. **One dirty
calibration ruins everything downstream, with no error message at all.**

That's why step 1 insists on a steady reading. Don't try to work around it.

### ⚠️ Times are stored in a worldwide standard

The system stores times in **Coordinated Universal Time**, not local time. Start
a calibration at 3pm and internally it's recorded as a different hour. **The
screen still shows 3pm** — only the stored copy is converted.

Why the fuss? Because if different parts stored time differently, rewinding to
the marked stretch would land in the wrong place, and the calibration would be
worthless without anyone noticing.

### Elapsed time follows the readings, not your clock

*"Recording for 3m 12s"* is counted from the **timestamp of the most recent
reading**, not from the clock on your device. So if the data stops flowing, the
counter stops too — which is more honest.

### Variable load appliances need more runs

Air conditioners and fridges change their power constantly, so one run isn't
enough to get a stable figure. Step 1 warns you about this in advance.

### 📖 Some words, in plain language

| Word on screen / in this guide | What it means                                                         |
|--------------------------------|-----------------------------------------------------------------------|
| **Baseline**                   | What your house draws when nobody is doing anything                   |
| **Signature**                  | An appliance's own way of drawing power: how many watts, for how long |
| **Calibration**                | One session where you switch an appliance on so the system can watch  |
| **Run**                        | One pass through the guide, step 1 to step 5                          |
| **Discarded**                  | A run you stopped halfway; it doesn't count                           |
| **Event**                      | A time the system later spotted an appliance running, by itself       |
| **Reading**                    | One power measurement, taken every second                             |

### If the power won't settle

At step 1, if the line stays amber:

1. Look around for something that just switched itself on: fridge, air
   conditioner, hot water
2. Wait for it to finish its cycle, then try again
3. Just wait — the latch only needs 5 quiet seconds

---

**Next:** [UC-04 · Dashboard](./uc-04-dashboard.md)
