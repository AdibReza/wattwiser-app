# UC-07 · Simulated switches

**Screen:** `/dev` — *Demo controls*
**For:** whoever is demoing or testing the app (**not** a customer)

---

## What this screen does

A panel with **4 switches**, each standing in for a simulated appliance. Flip one
on and the power on the dashboard jumps within a second.

**This is not a customer screen.** It exists for demos and development: instead
of walking to the kitchen and plugging in a real kettle.

---

## When to use it

- **Before looking at the dashboard** — flip a switch so the graph has a shape
- **While teaching the system an appliance** — this stands in for switching on a
  real one
- While developing, when you need the numbers to move

### Why it matters

> **Understand this screen before you try any of the others.**

With no switches on:

- Power just drifts around **350 W**
- The graph is nearly a straight line
- The calibration guide records a flat, meaningless stretch
- Everything looks like the system is broken

Flip one switch and it all comes alive.

---

## Steps

### 1 — Open the screen

Click **Demo controls** in the lower group of the left sidebar.

### 2 — Flip switches

```
   Demo controls
   Flip simulated appliances on and off. The live power on the
   dashboard follows within a second.

   Current power          2.6 kW

   ┌──────────────────────────────────────────────────┐
   │  Kettle                    2200 W      [ ●——— ]  │
   │  Washing machine           2000 W      [ ———○ ]  │
   │  Microwave                 1200 W      [ ———○ ]  │
   │  Air conditioner           1500 W      [ ———○ ]  │
   └──────────────────────────────────────────────────┘

   The house baseline drifts between 300 W and 400 W on its own,
   with a little noise, like a real home with a fridge and
   standby loads.
```

| Switch              | Power  | Stands in for                               |
|---------------------|--------|---------------------------------------------|
| **Kettle**          | 2200 W | A kettle — big step, short                  |
| **Washing machine** | 2000 W | A washing machine — big step, long          |
| **Microwave**       | 1200 W | A microwave — medium step, very short       |
| **Air conditioner** | 1500 W | An air conditioner — medium step, very long |

### 3 — See the effect

Open the dashboard in another tab. The power follows within **1 second**.

---

## What you'll see

### How the number is built

```
power = a baseline drifting between 300–400 W
      + the total of every switch that's ON
      + random noise of ±20 W
```

The baseline follows a slow wave, one cycle every 10 minutes, around 350 W. It is
**not** a fixed number — a real house never sits at exactly 350 W.

### Examples

| Switches on              | Power shown  |
|--------------------------|--------------|
| None                     | ~330–370 W   |
| Kettle                   | ~2530–2570 W |
| Kettle + Air conditioner | ~4030–4070 W |
| All four                 | ~7250–7290 W |

---

## Worth knowing

### Why switch states are kept in one shared place

You might think keeping them in the browser would be enough. It isn't, because:

- You have this screen open in one tab and the dashboard in another — **both tabs
  must agree**
- The server works out the power from these states, so they have to live on the
  server side
- Close the browser and reopen it, and the switches are still as you left them

### ⚠️ This is not a customer screen

It sits in the **lower group** of the sidebar, next to *Household setup*,
separated from the main group by a rule. Once a real meter is wired in, this
screen disappears.

When demoing to a customer, **say so** — otherwise they'll assume the real
product has remote on/off switches for their appliances.

---

**Next:** [UC-08 · Put a change live](./uc-08-deploy.md)
