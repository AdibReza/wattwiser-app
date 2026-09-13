# UC-04 · Dashboard

**Screen:** `/dashboard`
**For:** the household

---

## What this screen does

The app's main screen. It answers one question: **"how much electricity is my
house using right now?"**

Four number tiles, a 60-second graph, and prompts when there's something to do.

### First: how kW and kWh differ

Almost everyone mixes these up, and this whole screen turns on the difference.
Think of a **motorbike**:

| On a motorbike                | On this dashboard             | What it is                                        |
|-------------------------------|-------------------------------|---------------------------------------------------|
| The **speedometer** — 40 km/h | **Current power** — 2.6 kW    | Right this second, how fast you're going          |
| The **odometer** — 12 km      | **Today's energy** — 12.4 kWh | Since midnight, how far you've travelled in total |

A few things follow from that:

- Speed **goes up and down**; distance travelled **only ever increases**.
- Ride at 40 km/h for an hour and you cover 40 km. Draw **1 kW for 1 hour** and
  you use **1 kWh**. The "h" in kWh is the hour.
- **Your bill is charged per kWh**, not per kW. A kettle draws 2.2 kW, which
  sounds enormous, but it only runs 3 minutes — so it uses 0.11 kWh. A fridge
  draws only 0.15 kW, but runs around the clock, so it uses 3.6 kWh a day —
  **more than 30 times the kettle.**

> 💡 In short: **kW is how fast you're going. kWh is how far you've gone.** Your
> bill only cares about the second one.

### The same thing, in money

The sample data prices peak power at **$0.45/kWh**. So
`Today's energy: 12.4 kWh` means:

```
12.4 kWh  ×  $0.45/kWh  =  $5.58   ← what your power has cost since midnight
```

That's the whole reason this screen exists: turning an invisible number into one
you can feel.

---

## When to use it

- It's where the app opens
- When you want to know what the house is drawing right now
- When you want to check the meter is still connected

### Why it matters

The dashboard is **proof the system is alive**. The number moves in real time,
the graph twitches. It turns an abstract idea ("monitoring electricity") into
something you can see.

It's also where the system **tells you there's something to do**: your home isn't
set up yet, or there are questions waiting for you.

---

## Steps

### 1 — Read the four tiles

```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Current power │ Device status │ Today's energy│  Appliances   │
│               │               │               │               │
│    2.6 kW     │  [Connected]  │    12.4 kWh   │      6        │
│               │               │               │  4 calibrated │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

| Tile               | What it is                                | In plain words                                        | Updates      |
|--------------------|-------------------------------------------|-------------------------------------------------------|--------------|
| **Current power**  | Whole-house power right now, **in green** | "How fast you're going"                               | every second |
| **Device status**  | Whether the meter is still reporting      | "Is the meter still talking"                          | every second |
| **Today's energy** | Total used since midnight                 | "How far you've gone today" → times the price = money | periodically |
| **Appliances**     | How many, and how many taught             | "How many the system knows by sight"                  | on page load |

**Reading those four as a sentence:** *the house is drawing 2.6 kW (fairly high —
something like a kettle or the air conditioner must be on); the meter is still
connected; since midnight it's used 12.4 kWh, about $5.58; six appliances are
declared but the system has only learnt four of them.*

> 💡 **Green is only ever used for the live power figure.** That's a rule of the
> design system: one colour, one meaning.

### 2 — Read the graph

```
┌──────────────────────────────────────────────────────────────┐
│  Power over time                               last 60 seconds│
│                                                              │
│  2.6kW ┤        ┌──────────────────                          │
│        │        │                                            │
│  350 W ┤────────┘                                            │
│        └──────────────────────────────────────────────►      │
└──────────────────────────────────────────────────────────────┘
```

The power line over the **last 60 seconds**.

### A worked example: watch the number jump

Stand on this screen, then go and switch on something hungry — a kettle, say:

| #   | What you do                                | **Current power** shows     | The graph            |
|-----|--------------------------------------------|-----------------------------|----------------------|
| 1   | Switch nothing on, wait 10 seconds         | **~352 W**                  | flat, low            |
| 2   | Switch on a kettle (2200 W)                | **~2552 W** within a second | a vertical step      |
| 3   | Switch on the air conditioner too (1500 W) | **~4052 W**                 | a second step on top |
| 4   | Switch the kettle off                      | **~1852 W**                 | drops one notch      |
| 5   | Switch the air conditioner off             | **~352 W**                  | back to baseline     |

**That's the whole problem of this project, in one minute.** At step 3 the meter
sees exactly **one** number: `4052 W`. It does **not** know that's two
appliances. It doesn't know which is 2200 and which is 1500. It just sees 4052.

WattWiser's job is to reason backwards:

```
Sees:       4052 W
Knows:      baseline ~352 W
Therefore:  3700 W belongs to appliances
Looks up:   3700 = 2200 + 1500  →  "kettle + air conditioner"
```

And the thing it "looks up" is what you taught it in
[UC-03](./uc-03-calibration.md). Without calibration there's nothing to look up,
and 4052 W stays 4052 W forever.

---

### 3 — Deal with the prompts

Two kinds can appear at the top of the page:

| Prompt                          | When it shows                         | Button             |
|---------------------------------|---------------------------------------|--------------------|
| *"Finish setting up your home"* | Your home isn't set up                | **Complete setup** |
| *"3 runs need checking"*        | There are low-confidence runs waiting | **Check them**     |

### 4 — Use the two quick actions

Top right:

| Button                | What it does                               |
|-----------------------|--------------------------------------------|
| **Add appliance**     | Goes to the add-appliance form             |
| **Start calibration** | Opens the appliance picker, then the guide |

**Start calibration** is the page's **main** action (solid button), **Add
appliance** is secondary (outlined).

> 💡 A rule of this project: **every screen has exactly one main action.** Two
> buttons never compete for your attention.

---

## When it's working

- **Current power** changes every second, around 350 W when the house is idle
- **Device status** shows **Connected** in green
- **Today's energy** shows a kWh figure
- The graph has a line in it, not an empty box

### When you switch an appliance on

- **Current power** jumps within a second
- The graph draws a vertical step

---

## Worth knowing

### ⚠️ What "Connected" really means

There's no meter plugged into your house yet. The sensor here is **simulated**,
and it only wakes up when someone has the app open. Nobody looking means no
numbers being produced.

```
An app tab is open
        → the browser asks every second
        → a number is produced and the meter marked "just seen"
        → status tile: Connected ✅

All tabs closed
        → nobody asks
        → nobody marks it
        → after 10 SECONDS: Not Connected ❌
```

Once a real meter is wired into the house this goes away — a real meter reports
around the clock.

**What follows:** keep a tab open. If you wander off for a coffee and come back,
the status tile may be red. That's not a fault; it's just that nobody was asking
while you were away.

**Also:** power history only builds up while a tab is open. The last-60-seconds
data only exists if you've had the page open for at least 60 seconds.

### ⚠️ "Today's energy" — whose "today"?

"Today" starts at **midnight on your own device's clock** — not midnight in
London or on the server. Your computer works out that moment before asking.

So: look at 6am and the number is small (only six hours in); look at 11pm and
it's nearly a full day. And at midnight it **resets to zero** and starts again.

> Internally the system always stores times in a worldwide standard and only
> converts to local time at the moment of display. That's a project-wide rule.

### Zero versus a dash

- **`—`** means *no data yet* (still loading, or the connection dropped)
- **`0 W`** means *there is data, and it's zero*

You'll never see odd machine words on screen — every number goes through one
formatter.

### The page title is your home's name

Once your home is set up the title is its name (`12 Smith St`). Before that it's
just `Dashboard`.

### The confirmation prompt is the main way into that screen

Most people will reach the confirmation queue **through this prompt**, not
through the menu. That's deliberate: the system tells you when there's something
to do, rather than making you go and check.

---

**Next:** [UC-05 · Where the money goes](./uc-05-breakdown.md)
