# UC-05 · Where the money goes

**Screen:** `/breakdown`
**For:** the household

---

## What this screen does

The screen that answers the question the whole project was born from: **"where
did last month's electricity bill go?"**

It gathers every run detected in a month, groups them by appliance, applies your
prices, and lays it out as a ranking.

### Think of it like an itemised phone bill

Old phone bills **itemised every call**: who you rang, what time, for how long,
what it cost. One glance and you knew where the money went.

**Electricity bills don't do that.** They give you one number: *you used 350 kWh
this month, you owe $157.* That's it. Nobody tells you how much of that was the
air conditioner.

**This screen is the itemised bill, for electricity.**

> ⚠️ With one important difference: the phone company **knows for certain** who
> you called. WattWiser **guesses**, from a single whole-house meter. That's why
> this screen always shows a confidence level, and always keeps a "don't know"
> row. That's where it's more honest than most software.

---

## When to use it

- When the bill arrives and you want to know why it's so high
- At the end of the month, to compare with last month
- When you're thinking about replacing an old appliance

### Why it matters

**This is the end product of the entire system.** Everything else — your home
profile, the appliance list, calibration, the meter — exists to produce this
screen.

If you only ever show someone **one** screen of WattWiser, show them this one.

---

## Steps

### 1 — Read the three summary tiles

```
┌───────────────────┬────────────────────┬───────────────────┐
│   Energy used     │  Estimated cost    │    Identified     │
│                   │                    │                   │
│    52.5 kWh       │      $15.74        │       72%         │
│  September 2026   │ Time of use,       │ 28% could not be  │
│                   │ $0.45 peak         │ matched           │
└───────────────────┴────────────────────┴───────────────────┘
```

| Tile               | What it is                                                                |
|--------------------|---------------------------------------------------------------------------|
| **Energy used**    | Total energy of every run detected in the month                           |
| **Estimated cost** | The money, worked out from your prices. The line below names which tariff |
| **Identified**     | What share could be traced to a specific appliance                        |

**Reading those three as a sentence:** *"In September the house used 52.5 units,
costing about $15.74. I know which appliance 72% of that was; the other 28% is a
mystery."*

> 💡 **The third tile is the valuable one.** Software that makes numbers up would
> always say 100%. The 72% is a confession, and it tells you how much to trust
> the table below.

### 2 — Read the ranking

```
Appliance           Energy      Share             Cost    Confidence
─────────────────────────────────────────────────────────────────────
Air conditioner     19.9 kWh    ████████   37.9%  $5.97   [Medium]
Dishwasher          11.2 kWh    █████      21.3%  $3.36   [High]
Kettle               6.6 kWh    ███        12.6%  $1.96   [High]
Washing machine      4.2 kWh    ██          8.0%  $1.26   [High]
Unknown / Other     14.8 kWh    ██████     28.2%  $4.45   —
─────────────────────────────────────────────────────────────────────
                                                          ↑ always last
```

Sorted **most to least**. Every row has a bar **and the percentage written out**
— so it still reads for someone who's colour-blind.

### A worked example: reading one row closely

Take the top row:

```
Air conditioner     19.9 kWh    ████████   37.9%  $5.97   [Medium]
```

Piece by piece:

| Piece             | What it is                                       | Where it came from       |
|-------------------|--------------------------------------------------|--------------------------|
| `Air conditioner` | An appliance you declared yourself               | your appliance list      |
| `19.9 kWh`        | Every time the AC ran this month, added up       | ~20 evenings × 2–4 hours |
| `37.9%`           | 19.9 ÷ 52.5, the month's total                   | division                 |
| `$5.97`           | 19.9 kWh × the price, split by peak and off-peak | the tariff you entered   |
| `[Medium]`        | The system is **fairly** sure, not certain       | see below                |

As a sentence: *"Last month the air conditioner used nearly 20 units, 38% of the
bill, about $6. The system is reasonably confident it was the AC, but won't
swear to it."*

### Why the kettle gets **High** and the AC only **Medium**

Remember the three appliance types:

| Appliance           | Type          | How it "signs" the wiring                                                    | Easy to spot?     |
|---------------------|---------------|------------------------------------------------------------------------------|-------------------|
| **Kettle**          | Simple        | On → exactly 2150 W → 3 minutes → off. Same every time.                      | Very → **High**   |
| **Air conditioner** | Variable load | Constantly moving: 1400 W, then 800 W, then 1200 W, depending on the weather | Hard → **Medium** |

It's like recognising people by sound. A neighbour whose cough is always the same
is easy — you hear it and you know. Someone who speaks loudly or softly depending
on their mood, you can only say "that's probably him".

### What's inside "Unknown / Other"

Nearly 15 kWh, 28% of the bill, that the system can't place. Usually three
things:

1. **Appliances you haven't declared** — a fan, a hairdryer, a laptop charger
2. **Appliances declared but never taught** — they're on the list, but the system
   has never been shown them working
3. **Two appliances switched on together** — the steps blur into one and can't be
   separated

**How to shrink this row:** declare more appliances
([UC-02](./uc-02-appliance-inventory.md)) and teach them more times
([UC-03](./uc-03-calibration.md)). That's exactly why those two screens exist.

---

### 3 — Look at recent activity

The **Recent activity** section below: the last 20 runs detected.

```
Kettle              11 Sep 2026, 7:02 am    0.11 kWh
Dishwasher          10 Sep 2026, 8:30 pm    1.48 kWh
Air conditioner     10 Sep 2026, 6:15 pm    2.90 kWh
Unknown             10 Sep 2026, 3:41 pm    0.34 kWh
```

### 4 — Change the month

The month picker is at the top right. The month goes into the **web address**:

```
/breakdown?month=2026-08
```

> 💡 So you can **send someone the link** and they'll open the same month. It
> lives in the link itself, not in your browser's temporary memory.

---

## What you'll see

### With data and prices entered

Everything: three tiles, the ranking with a cost column, recent activity.

### Without prices entered

- A prompt at the top: *"Add your tariff to see costs"* with a **Complete setup**
  button
- **Estimated cost** shows `—`
- The cost column disappears from the table
- **Energy still shows normally** — only the money is missing

### When a month has no data

An empty screen: *"Nothing detected in August 2026"* with a **Go to appliances**
button.

---

## Worth knowing

### ⚠️ The "Unknown / Other" row is always shown

The single most important design decision on this screen.

**Unknown / Other** gathers every run that couldn't be traced to an appliance.
It:

- **Is always there**, even at 0 kWh
- **Is always last**, however big or small
- **Has no confidence** — that cell is blank, not "Low"

**Why not just hide it and keep things tidy:**

> Hiding it would be a lie. It would present a world where every watt traces to
> an appliance, which isn't true. Better to admit 28% is unknown than to spread
> that 28% across the other appliances and corrupt every figure.

The **Identified** tile (72%) is the other side of the same coin.

### ⚠️ Confidence is never shown as a number

Internally the system scores from 0 to 1. On screen you only ever see three
words:

| Internal score | Shown as   |
|----------------|------------|
| ≥ 0.8          | **High**   |
| ≥ 0.5          | **Medium** |
| < 0.5          | **Low**    |

**Why:** `0.73` looks like a **measurement**. It isn't — it's a **guess**.
"Medium" tells the truth better.

A row's confidence is weighted **by energy** — a big run counts for more than a
small one.

### ⚠️ These are estimates, not measurements

There's a line right under the table saying so:

> *"These are estimates worked out from the whole-house meter, not measurements
> of each appliance."*

There is only **one** meter, at the main board. Every per-appliance figure is
reasoning backwards.

Put another way: there is no sensor attached to the air conditioner. The "19.9
kWh" is the system looking at the main meter, spotting 20 occasions with a step
that looked like the AC, and adding them up. If one evening you ran the AC **at
the same time** as the washing machine, there's a good chance both got merged
into one and landed in *Unknown*.

**That error is inherent to the method, not a software bug.** The only way to get
exact figures is a separate meter on every socket — expensive and a nuisance,
which is why WattWiser exists.

### How each kind of tariff is worked out

| Kind            | How                                                                                           | Example                                |
|-----------------|-----------------------------------------------------------------------------------------------|----------------------------------------|
| **Flat rate**   | `kWh × price`. That's it.                                                                     | 19.9 kWh × $0.30 = **$5.97**           |
| **Time of use** | Each run is **sliced into 5-minute pieces**, then it checks which pieces fall in peak hours   | see below                              |
| **Tiered**      | Tiers apply to the **whole month**, so every row is priced at the month's **blended average** | first 500 units cheap, from 501 dearer |

**Time of use, in numbers:** say the AC runs 3 hours, 6pm to 9pm, using 3.5 kWh.
Peak is 3pm–9pm, so **all 3 hours are peak**:

```
3.5 kWh  ×  $0.45  =  $1.58
```

Same air conditioner, same 3 hours, but running 10pm to 1am — outside peak:

```
3.5 kWh  ×  $0.22  =  $0.77
```

**Same amount of electricity, twice the money.** That's why this screen has to
know **what time** each run happened, not just the monthly total.

**⚠️ Two settings are fixed and the setup form doesn't ask about them yet:**

1. Time zone: **Australia/Sydney**
2. Peak hours: **weekdays, 3pm–9pm**

If your home is in another time zone or has different peak hours, the money will
be off. A known limit of this first version.

The pricing has its own automated check that runs every time a new version goes
live — if the arithmetic is wrong anywhere, that version doesn't ship.

### Change your prices and old months change too

This page **recalculates every time you open it**. Edit your prices today and
last month's cost figures change with them.

That's deliberate: there is only **one** definition of your prices. No stale copy
stuck from an earlier month.

### The month picker only lists months with data

Not every month on the calendar. Only months that actually have runs recorded.

---

**Next:** [UC-06 · Answer questions](./uc-06-confirmations.md)
