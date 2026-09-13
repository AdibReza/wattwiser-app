2️⃣  APPLIANCE LIST
════════════════════════════════════════

Screens: /appliances · /appliances/new · /appliances/<id>


📌  WHAT IT DOES

   • You list every electrical appliance in the house
   • For each one: what you call it, what group it's in,
     and — most important — which of THREE TYPES it is
   • This list is the set of candidates. When the system
     sees a jump in power, it only looks inside this list


🕐  WHEN TO USE IT

   • Right after setting up your home
   • When you buy a new appliance
   • When you want to see an appliance's teaching history
   • When you want to start teaching the system one


⭐  WHY IT MATTERS

   When power jumps by 2200 W, the system has to answer:
   "what in this house draws 2200 W?"

   It only searches this list.

   🚨 Declare nothing and EVERY jump lands in the
      "Unknown / Other" bucket.

   You also can't teach the system an appliance
   that isn't on the list.


👆  A. VIEWING THE LIST

   Click "Appliances" in the sidebar.

   The page title gives you the summary at a glance:

      6 appliances · 4 calibrated

   Each row shows the name, the group, and a label:

      Air conditioner            [ Calibrated · 3 runs ]
      Heating & cooling


👆  B. ADDING AN APPLIANCE

   Click "Add appliance". The form has three sections.


   📋  Section 1 — "About the appliance"

      • Name — REQUIRED
        What you call it, up to 60 characters

      • Category — REQUIRED
        Kitchen · Laundry · Heating & cooling ·
        Hot water · Entertainment · Other


   ⚡  Section 2 — "Appliance type"  ← the important one

      Three buttons. Pick one.

      • Simple
        "Switches on, draws steady power, switches off.
         Kettle, toaster, heater, lamp."
        → Pick it when it draws one steady amount,
          then stops

      • Multi-stage
        "Runs a cycle with several phases. Washing machine,
         dishwasher, dryer, oven."
        → Pick it when it runs a cycle with distinct phases

      • Variable load
        "Power goes up and down while running.
         Air conditioner, fridge, EV charger, pool pump."
        → Pick it when its power keeps moving while it runs


   📝  Section 3 — "Optional details"

      Nothing here is required.

      • Rated power
        The number on the label, 1 to 50,000
        The box shows "W" on the right

      • Make and model
        Brand and model, up to 80 characters

      • How you usually use it
        e.g. 40°C cotton cycle, most mornings
        Up to 200 characters

      • Notes
        Anything you like, up to 500 characters


   Press "Add appliance" to save.


✏️  EXAMPLE 1 — THE MINIMUM

   Just the required fields, plus the nameplate figure.

      Name ................... Microwave
      Category ............... Kitchen
      Appliance type ......... Simple
      Rated power ............ 1200
      Make and model ......... (blank)
      How you usually use it . (blank)
      Notes .................. (blank)

   Simple, because a microwave switches on, draws a
   steady amount, and switches off.


✏️  EXAMPLE 2 — ALL SEVEN FIELDS

      Name ................... Clothes dryer
      Category ............... Laundry
      Appliance type ......... Multi-stage
      Rated power ............ 2400
      Make and model ......... Bosch WTH85222AU
      How you usually use it . cotton, twice a week, evenings
      Notes .................. Old machine, runs long

   Multi-stage, because a dryer runs a cycle with several
   phases — tumble, heat, cool-down — each drawing a
   different amount.


🤔  NOT SURE WHICH TYPE?

   Ask yourself: if I drew a graph of its power,
   what shape would it be?

      Simple:          ┌──────────┐
                    ───┘          └───

      Multi-stage:      ┌─┐   ┌────┐  ┌┐
                    ────┘ └───┘    └──┘└──

      Variable load:      ╱╲  ╱╲╱╲
                    ─────╱  ╲╱    ╲───


👆  C. EDITING AN APPLIANCE

   Click any row in the list. The page has three parts.

   1. The same form as adding, already filled in
      Button: "Save changes"

   2. Calibration history
      One row per teaching session: date, duration, status

   3. A red "Delete" button, with a confirmation

   At the top there's a "Start calibration" button.


👆  D. DELETING AN APPLIANCE

   Click "Delete" → confirm in the dialog.

   ⚠️ Deleting removes every teaching session and
      everything learnt for it.

      Runs already detected are NOT deleted — they just
      lose their link and fall into "Unknown / Other".


✅  WHEN IT'S DONE

   • The new appliance appears, labelled "Not Calibrated"
   • The count in the title goes up: 6 → 7 appliances
   • After an edit, a small confirmation pops up


🚨  THE BIGGEST MISUNDERSTANDING

   The number on the label is NOT how it gets identified.

   "Rated power" is optional and for reference only.
   It helps narrow the list. It is never the thing
   that identifies an appliance.

   Why:

      • A washing machine has several modes —
        cold wash ~200 W, hot wash ~2000 W
      • One cycle has several phases, each at a
        different level
      • Air conditioners and fridges use inverter
        compressors; their power moves constantly
      • The label shows PEAK power, not TYPICAL power

   ➜ The real numbers come from teaching the system,
     not from the label.


⚠️  WORTH KNOWING

   What "Calibrated" means
      Only that at least one teaching session finished.
      NOT that it's been taught well enough.
      Three to five sessions is the recommendation.
      The count sits next to the label:
      "Calibrated · 3 runs"

   Where "Start calibration" lives
      Two ways in:
      • The button at the top of the EDIT page
      • The appliance picker on the dashboard
      The ADD page does NOT go straight into it.
      Add it first, then open it, then press the button.

   No limit on how many
      Declare as many as you like. But a few appliances
      taught properly beats many left untouched.
      An untaught appliance contributes nothing.


🚫  ERROR MESSAGES YOU MIGHT SEE

   • "Give the appliance a name"
   • "Pick a category"
   • "Pick an appliance type"
   • "Whole numbers only"
   • "Must be at least 1 W"
   • "That looks too high"   (over 50,000 W)


➡️  NEXT

   3️⃣  Teach an appliance  →  03-teach-an-appliance.md
