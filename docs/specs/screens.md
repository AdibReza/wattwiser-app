# Screens and input specification

The web side's build target. Every screen here maps to something in
[`website-details.md`](../source/website-details.md) or [`refined-flow-and-tasks.md`](../source/refined-flow-and-tasks.md).

**No login screen — this MVP has no authentication.**

**Visual rule for every screen: simple and modern. Ugly is not acceptable.**
Clean spacing, one clear primary action per screen, readable numbers.

## Screen map

| Route | Purpose | Build step |
|---|---|---|
| `/` | redirects to `/dashboard` | 1 |
| `/setup` | household profile (first-run questionnaire) | 3 |
| `/dashboard` | live power, today's energy, device status, chart | 6 |
| `/appliances` | inventory list | 4 |
| `/appliances/new` | add appliance | 4 |
| `/appliances/[id]` | edit appliance + calibration history | 4 |
| `/calibration/[id]` | 5-step wizard | 7 |
| `/breakdown` | energy + cost per appliance, confidence | 9 |
| `/confirm` | "Was this your dishwasher?" queue | 10 |
| `/dev` | demo control panel (toggle simulated appliances) | 5 |

---

## 1. Household setup — `/setup`

From [`refined-flow-and-tasks.md` §2](../source/refined-flow-and-tasks.md#2-customer-facing-website). **This is the core input UI for the MVP.**

Its purpose is to narrow what the system needs to look for. If the household has
no EV and no dryer, those never need considering when explaining a large event.

### Fields

| Field | Type |
|---|---|
| Household name / label | text |
| Number of occupants | number |
| Home type | dropdown — house / apartment / townhouse |
| Hot water | dropdown — electric / gas / solar / heat pump / don't know |
| Heating | dropdown — electric / gas / reverse-cycle AC / none |
| Cooling | dropdown — split AC / ducted AC / fans only / none |
| Has solar panels | yes / no |
| Has home battery | yes / no |
| Has EV | yes / no |
| Electricity tariff type | dropdown — flat rate / time-of-use / tiered |
| Tariff rate(s) | number(s), used later for cost conversion |

### Behaviour

- Saved to the single `household` row.
- Editable at any time from a Settings link.
- If the household row is empty on first load, `/dashboard` prompts the user to
  complete setup.

---

## 2. Dashboard — `/dashboard`

From [`website-details.md` §2](../source/website-details.md#2-dashboard), extended with device status and chart.

- **Current Power** — large number in W, updating every second
- **Today's Energy** — kWh
- **Device Status** — Connected / Not Connected
- **Appliance count** — with how many are calibrated, e.g. "6 appliances · 4 calibrated"
- **Power over time** — line chart, last 60 seconds live
- Quick actions: `Add Appliance` · `Start Calibration`

All numbers come from the mock generator in this MVP —
[`mock-data.md`](./mock-data.md).

---

## 3. Appliances — `/appliances`

From [`website-details.md` §3](../source/website-details.md#3-appliances).

- List of all appliances (single household — no filtering by user)
- Each row: name, category, and `Calibrated` or `Not Calibrated`
- If calibrated, show the run count: `Calibrated · 3 runs`
- `+ Add Appliance` button

---

## 4. Add / edit appliance — `/appliances/new`, `/appliances/[id]`

From [`website-details.md` §4](../source/website-details.md#4-add-appliance), extended with the fields
[`refined-flow-and-tasks.md` §3](../source/refined-flow-and-tasks.md#3-initial-appliance-inventory) asks for.

| Field | Type | Notes |
|---|---|---|
| Appliance name | text | required |
| Category | dropdown | Kitchen / Laundry / Heating & cooling / Hot water / Entertainment / Other |
| Appliance class | dropdown | **simple / multi-stage / variable-load** — drives which wizard copy is shown |
| Rated wattage | number | optional. Reference only, never the identification method |
| Make / model | text | optional |
| Common settings or modes | text | optional, e.g. "usually 40°C cotton cycle" |
| Notes | text | optional |

`Start Calibration` saves the appliance and goes straight into the wizard.

The edit page also shows **calibration history**: one row per session with date,
duration, and status.

> **Why rated wattage is not the identifier.** It narrows the candidate set only.
> [`refined-flow-and-tasks.md` §3](../source/refined-flow-and-tasks.md#3-initial-appliance-inventory) is explicit: appliances have multiple modes,
> stages, heating cycles and variable-speed components, so the nameplate figure
> cannot be trusted. The real figures come from calibration.

---

## 5. Calibration wizard — `/calibration/[id]`

From [`website-details.md` §5](../source/website-details.md#5-calibration) and [`refined-flow-and-tasks.md` §4–5](../source/refined-flow-and-tasks.md#4-guided-appliance-calibration).
**This is the core of the MVP.** Five steps, one screen each.

| Step | Screen | What happens |
|---|---|---|
| 1 | "Make sure [appliance] is OFF" + `I'm Ready` | check the total power is stable before starting |
| 2 | "Turn [appliance] on as you normally would" | record `started_at` and `baseline_w` |
| 3 | "Recording…" + live power chart | — |
| 4 | "Wait for it to finish, then switch it off" + `Done` | — |
| 5 | "Complete" + "Run calibration again?" | record `ended_at` |

### Wizard copy changes by appliance class

This is the part most easily missed.

| Class | Step 2 copy | Step 4 copy | Extra |
|---|---|---|---|
| **Simple** | as above | as above | — |
| **Multi-stage** | "Start a normal cycle now, the one you use most often." | "Leave it running to the end of the cycle, then press Done." | Warn that this may take 45–70 minutes. |
| **Variable-load** | "Turn it on and set it as you normally would." | as above | Note on screen that this appliance type is harder to identify and may need more runs. |

### Hard requirements

1. Each wizard run creates **exactly one** row in `calibration_sessions`.
2. Repeat runs for the same appliance are expected — **3 to 5 per appliance**.
3. A **Cancel** button on every step that marks the session `discarded`.
4. All timestamps stored in **UTC**.

### Contamination guard

Not in the original docs. Cheap to add, and it protects all downstream data.

- Before step 1 enables `I'm Ready`, check total power is **stable — varying by
  less than 50 W over 5 seconds**. If it is fluctuating, show
  *"Hold on — something else is running."*
- Display a reminder during recording: *"Avoid switching on other appliances for
  the next 2 minutes."*

---

## 6. Breakdown — `/breakdown`

From [`refined-flow-and-tasks.md` §12–13](../source/refined-flow-and-tasks.md#12-energy-disaggregation-output). Reads from `events` — mocked in this
MVP.

- Per-appliance estimated kWh for the selected month, with percentage
- **Cost** for each, using the tariff from household setup
- **Confidence** shown as High / Medium / Low, never as an exact measurement
- **Unknown / Other** row always present
- Usage history: when each appliance was estimated to have run

> `appliance_id = null` is the Unknown bucket and **must stay visible**.
> [`refined-flow-and-tasks.md` §12](../source/refined-flow-and-tasks.md#12-energy-disaggregation-output) says it directly: don't pretend every watt
> can be assigned.

### Optional, if time allows

Per [`refined-flow-and-tasks.md` §13](../source/refined-flow-and-tasks.md#13-customer-dashboard):

- **Unusual usage callout** — "Hot water consumption is significantly higher
  than usual"
- **Recommendations** — "Your dishwasher frequently runs during your expensive
  tariff period"

**Rule for any generated wording: code does the maths, generated text only
writes the words.** Never send raw readings to a language model. Query the
database, produce a short summary, generate prose from that summary only, and
cache the result so a flaky connection during a demo doesn't leave the page blank.

---

## 7. Confirmation — `/confirm`

From [`refined-flow-and-tasks.md` §10](../source/refined-flow-and-tasks.md#10-human-in-the-loop-confirmation). Straight from the doc:

> "We detected a 1.8 kW appliance running between 7:15 PM and 8:05 PM. Was this
> your dishwasher?"

Options: **Yes** · **No** · **Choose another appliance** · **I don't know**

Each answer writes a row to `event_confirmations`. This is labelled data the data
side can later use — which is why it exists even though nothing consumes it yet
in this MVP.

---

## 8. Dev panel — `/dev`

**Not a customer screen.** A demo control panel: toggle each simulated appliance
on and off so the dashboard and wizard charts actually move during a live demo.

Backed by the mock generator — [`mock-data.md`](./mock-data.md).
