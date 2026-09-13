# UC-01 · Set up your home

**Screen:** `/setup` — *Household setup*
**For:** the household

---

## What this screen does

- Asks a short set of questions about your home: how many people live there,
  what heats your water, whether you have solar, and how you pay for power.
- There is only **one** home profile, and you can edit it any time.

---

## When to use it

- **The first time you open the app** — the dashboard keeps nagging
  *"Finish setting up your home"* until it's done.
- When your electricity company **changes its prices** — come back and edit the
  tariff section.
- When you **add** solar panels, a home battery, or an electric car.

### Why this screen matters

**(a) It narrows down the guessing.**
The meter only reports one total number. When it sees a 3000 W jump, the system
has to work out what that was. If you've said *"no electric car, no dryer"*,
those two candidates are ruled out immediately. Fewer candidates, better guesses.

**(b) No prices, no money.**
The breakdown screen always shows energy (kWh), but the **cost** column stays
blank until you enter your tariff.

---

## Steps

### 1 — Open the screen

- Click **Household setup** in the lower group of the left sidebar.

### 2 — The "Your home" section

| Field                  | What to enter                                                    |
|------------------------|------------------------------------------------------------------|
| **Home name**          | What you call the place, e.g. `12 Smith St`. Up to 80 characters |
| **People living here** | How many people live there, 1 to 20                              |
| **Home type**          | **House** · **Apartment** · **Townhouse**                        |

### 3 — The "Energy systems" section

| Field         | Choices                                             |
|---------------|-----------------------------------------------------|
| **Hot water** | Electric · Gas · Solar · Heat pump · **Don't know** |
| **Heating**   | Electric · Gas · Reverse-cycle AC · None            |
| **Cooling**   | Split-system AC · Ducted AC · Fans only · None      |

> 💡 **"Don't know" is a perfectly good answer.** Better to say you don't know
> than to guess wrong — a wrong guess sends the system looking for the wrong
> thing.

### 4 — The "Solar, battery and EV" section

Three yes/no switches:

| Switch               | The question                      |
|----------------------|-----------------------------------|
| **Solar panels**     | Does the house have solar panels? |
| **Home battery**     | Is there a battery storing power? |
| **Electric vehicle** | Is there an electric car?         |

> 💡 These three matter because they make the power graph look strange. Solar can
> push the reading **negative** when the house sells power back to the grid.
> Charging a car makes a very big, very long step.

### 5 — The "Electricity tariff" section

Pick one of three kinds:

| Kind            | How you pay                  | Fields                                             | Example                     |
|-----------------|------------------------------|----------------------------------------------------|-----------------------------|
| **Flat rate**   | Same price all day           | **Rate**                                           | `0.30` per kWh              |
| **Time of use** | Dearer at busy hours         | **Peak rate**, **Off-peak rate**                   | `0.45` / `0.22`             |
| **Tiered**      | The more you use, the dearer | **Tier 1 rate**, **Tier 1 up to**, **Tier 2 rate** | `0.25` / `300` kWh / `0.38` |

> ⚠️ **Time of use has two settings the form doesn't ask about yet:** peak hours
> are fixed at *weekdays, 3pm–9pm, Australia/Sydney time*. If your home is in a
> different time zone or has different peak hours, the money figures will be off.
> This is a known limit of this first version.

Then press **Save** at the bottom of the page.

> 💡 **Which one am I on?** Look at your electricity bill. One price per unit →
> flat rate. Different prices by time of day → time of use. Prices that step up
> after a certain number of units → tiered.

---

## When it's done

- A small confirmation pops up: **"Household saved"**.
- The dashboard title changes from *"Dashboard"* to **your home's name**.
- The *"Finish setting up your home"* prompt disappears.
- On the breakdown screen, the *"Add your tariff to see costs"* prompt
  disappears and the cost column fills in.

---

## Worth knowing

### There's only one home

This version has **no login**. One household, one shared set of data. The system
never keeps more than one home profile.

### Error messages

| Field              | What it says                                                                            |
|--------------------|-----------------------------------------------------------------------------------------|
| Home name          | *"Give your home a name"*                                                               |
| People living here | *"Whole numbers only"* / *"At least 1 person"* / *"At most 20 people"*                  |
| Any rate           | *"Enter a rate in $/kWh"* / *"A rate can't be negative"* / *"That rate looks too high"* |
| Tier 1 up to       | *"Enter the monthly kWh where tier 2 starts"* / *"Must be at least 1 kWh"*              |

### Tiered pricing is worked out across the whole month

Tiers apply to your **monthly total**, not to each individual run. So on the
breakdown screen every row is priced at the month's **blended average rate**.

---

**Next:** [UC-02 · Appliance list](./uc-02-appliance-inventory.md)
