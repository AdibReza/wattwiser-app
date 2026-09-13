# UC-02 · Appliance list

**Screen:** `/appliances`, `/appliances/new`, `/appliances/<id>`
**For:** the household

---

## What this screen does

- You declare every electrical appliance in the house: what you call it, what
  group it belongs to, and — most important — **which of three types** it is.
- This list is the set of candidates. When the system sees a jump in power, it
  only looks for a match **inside this list**.

Three screens in one: view the list, add a new one, edit one (with its
calibration history).

---

## When to use it

- Right after finishing **Set up your home**
- When you **buy a new appliance**
- When you want to **see the calibration history** of an appliance
- When you want to **start teaching** the system an appliance

### Why it matters

When the system sees power jump by 2200 W, it has to answer: *"what in this
house draws 2200 W?"* — and it only searches this list.

**Declare nothing and every jump lands in the "Unknown / Other" bucket.**

You also can't teach the system an appliance that isn't on the list.

---

## Steps

### A. View the list

Click **Appliances** in the sidebar. The page title gives you the summary at a
glance: **`6 appliances · 4 calibrated`**.

Each row shows:

```
Air conditioner                       [ Calibrated · 3 runs ]
Heating & cooling
```

If you have no appliances yet, you get an empty state with a button to start.

### B. Add an appliance

Click **Add appliance**. The form comes in **three sections**:

| Section                 | Field                      | Required | What to enter                                                             |
|-------------------------|----------------------------|----------|---------------------------------------------------------------------------|
| **About the appliance** | **Name**                   | Yes      | What you call it, up to 60 characters                                     |
|                         | **Category**               | Yes      | Kitchen / Laundry / Heating & cooling / Hot water / Entertainment / Other |
| **Appliance type**      | three radio buttons        | Yes      | Simple / Multi-stage / Variable load                                      |
| **Optional details**    | **Rated power**            | No       | The number on the label, 1–50,000 (the box shows `W` on the right)        |
|                         | **Make and model**         | No       | Brand and model, up to 80 characters                                      |
|                         | **How you usually use it** | No       | e.g. `40°C cotton cycle, most mornings`, up to 200 characters             |
|                         | **Notes**                  | No       | Anything you like, up to 500 characters                                   |

Press **Add appliance** to save.

#### Example 1 — the minimum

Just the three required fields, plus the nameplate figure:

```
Name .................... Microwave
Category ................ Kitchen
Appliance type .......... Simple
Rated power ............. 1200
Make and model .......... (leave blank)
How you usually use it .. (leave blank)
Notes ................... (leave blank)
```

**Simple**, because a microwave switches on, draws a steady amount, and switches
off.

#### Example 2 — all seven fields filled

```
Name .................... Clothes dryer
Category ................ Laundry
Appliance type .......... Multi-stage
Rated power ............. 2400
Make and model .......... Bosch WTH85222AU
How you usually use it .. cotton, twice a week, evenings
Notes ................... Old machine, often runs longer than it should
```

**Multi-stage**, because a dryer runs a cycle with several phases — tumble, heat,
cool-down — each drawing a different amount.

#### How to pick the type

This is the **most important field** on the form, because it decides the wording
of the instructions when you teach the system this appliance. Each choice comes
with its own description on screen:

| Type              | What it says on screen                                                                    | Pick it when                           |
|-------------------|-------------------------------------------------------------------------------------------|----------------------------------------|
| **Simple**        | *"Switches on, draws steady power, switches off. Kettle, toaster, heater, lamp."*         | It draws one steady amount, then stops |
| **Multi-stage**   | *"Runs a cycle with several phases. Washing machine, dishwasher, dryer, oven."*           | It runs a cycle with distinct phases   |
| **Variable load** | *"Power goes up and down while running. Air conditioner, fridge, EV charger, pool pump."* | Its power keeps moving while it runs   |

**Not sure?** Ask yourself: *"if I drew a graph of its power, what shape would
it be?"*

```
Simple:          ┌──────────┐
              ───┘          └───

Multi-stage:      ┌─┐   ┌────┐  ┌┐
              ────┘ └───┘    └──┘└──

Variable load:      ╱╲  ╱╲╱╲
              ─────╱  ╲╱    ╲───
```

### C. Edit an appliance

Click any row in the list. This page has **three parts**:

1. **The same form as adding**, pre-filled. Button: **Save changes**.
2. **Calibration history** — one row per run: date, duration, status.
3. A red **Delete** button, with a confirmation dialog.

At the top of the page there's a **Start calibration** button.

### D. Delete an appliance

Click **Delete** → confirm in the dialog.

> ⚠️ Deleting removes **every calibration run and signature** for it. Runs already
> detected are **not** deleted — they just lose their link and fall into the
> "Unknown / Other" bucket.

---

## When it's done

- The new appliance appears in the list, labelled **Not Calibrated**
- The count in the title goes up: `6 appliances` → `7 appliances`
- After an edit, a small confirmation pops up

---

## Worth knowing

### ⚠️ The number on the label is NOT how it gets identified

This is the most common misunderstanding about the whole project.

**Rated power** is **optional** and **for reference only**. It helps narrow the
list of candidates, but it is never how an appliance is identified.

**Why:**

- A washing machine has several modes — cold wash ~200 W, hot wash ~2000 W
- One cycle has several phases, each at a different level
- Air conditioners and fridges use inverter compressors; their power moves
  constantly
- The label shows **peak** power, not **typical** power

**The real numbers come from calibration**, not from the label.

### What "Calibrated" means

The **Calibrated** label only means: **at least one calibration run finished**.

It does **not** mean it's been calibrated well enough. Three to five runs per
appliance is the recommendation. The count sits right next to the label:
`Calibrated · 3 runs`.

### Where "Start calibration" lives

There are **two** ways into the calibration wizard:

1. The **Start calibration** button at the top of the **edit** page
2. The appliance picker dialog on the dashboard

**The add page only has *Add appliance*** — it does not go straight into the
wizard. Add the appliance, then open it, then press **Start calibration**.

### Error messages

| Field          | What it says                                                                                |
|----------------|---------------------------------------------------------------------------------------------|
| Name           | *"Give the appliance a name"*                                                               |
| Category       | *"Pick a category"*                                                                         |
| Appliance type | *"Pick an appliance type"*                                                                  |
| Rated power    | *"Whole numbers only"* / *"Must be at least 1 W"* / *"That looks too high"* (over 50,000 W) |

### There's no limit on how many

Declare as many as you like. But **a few appliances taught properly beats many
left untouched** — an appliance that's never been calibrated contributes nothing
to identification.

---

**Next:** [UC-03 · Teach it an appliance](./uc-03-calibration.md)
