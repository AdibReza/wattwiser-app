3️⃣  TEACH AN APPLIANCE
════════════════════════════════════════

Screen: /calibration/<appliance id>

⭐ THIS IS THE MOST IMPORTANT PART OF THE WHOLE APP.
   Skip it and every other screen is meaningless.


📌  WHAT IT DOES

   • A 5-step guide that teaches the system to
     recognise one specific appliance
   • You switch ONE appliance on while nothing
     else changes
   • The step in power that appears at that moment
     is that appliance's tell


💧  THINK OF IT LIKE A WATER METER

   Your house has ONE water meter out by the street.

   Looking at it, you can't tell whether water is going
   to the washing machine or the shower — only how much
   is flowing in total.

   But you can do this:

      • Turn everything off
      • Watch the meter sit still
      • Open EXACTLY ONE shower
      • See how much faster it spins

   From then on, whenever you see it spin at that rate,
   you can guess someone's in the shower — even though
   you're still only looking at the one meter.

   ➜ WattWiser does exactly this, with electricity.
     Teaching it an appliance is that "open exactly
     one shower" moment.


🔢  THE SAME STORY, IN REAL NUMBERS

      House doing nothing ...... 352 W
         (fridge, router, standby lights — the BASELINE)

      Microwave on ............. 1552 W
         (baseline + microwave)

      The difference ........... 1200 W
         ← this is what the system needs to learn

   1200 W for about 3–5 minutes is the "signature"
   of your microwave.

   From then on, if power jumps from 380 to 1580 at
   three in the afternoon and drops back four minutes
   later, the system can say:

      "microwave, ran for 4 minutes"

   ...with nobody pressing anything.

   💡 What does "signature" mean?
      Like a handwritten signature: everyone signs
      differently, and you recognise the person by
      the strokes. Every appliance also signs the
      wiring in its own way — how many watts,
      for how long, how steadily.


📈  WHAT IT LOOKS LIKE

      Whole-house power
        1552 W ┤           ┌──────────────────┐
               │           │                  │
               │           │  ← 1200 W gap:   │
               │           │    the microwave │
         352 W ┤───────────┘                  └──────
               │  baseline
               └──────────────────────────────────► time
                  ↑ press "It's on"   ↑ press "Done"


🕐  WHEN TO USE IT

   • After adding a new appliance to your list
   • When you want it recognised more accurately —
     just run it again
   • When the appliance is repaired or replaced


⭐  WHY IT MATTERS

   This is the ONLY thing that tells the system what
   an appliance looks like in the data.

   Without it:

      • Every run falls into "Unknown / Other"
      • The breakdown screen shows one row:
        unknown, 100%
      • The questions screen has nothing to ask about

   ➜ In short: without this, the product does nothing.


🔁  WHY THREE TO FIVE TIMES PER APPLIANCE

   One session gives the system ONE sample.

   Several sessions tell it:

      • What the USUAL power level is, not one
        lucky reading
      • How much the duration VARIES
      • For multi-stage appliances: whether the
        sequence of phases is consistent

   Step 5 says it outright:
   "Three to five runs gives the best result."


✏️  A FULL EXAMPLE — TEACHING IT YOUR MICROWAVE

   About 4 minutes, most of it waiting.

    1. Switch off anything running in the house
       → (nothing on screen yet)

    2. Open "Appliances", click "Microwave"
       → appliance page, labelled Not Calibrated

    3. Press "Start calibration"
       → Step 1/5, Total power right now: 352 W

    4. Wait a few seconds, don't touch anything
       → text turns GREEN:
         "Steady at about 352 W. Good to go."
         "I'm ready" becomes clickable

    5. Press "I'm ready"
       → Step 2/5, Baseline captured — 352 W

    6. Go to the kitchen, START THE MICROWAVE
       → (nothing on screen yet)

    7. Come back and look at "Live"
       → Live: 1552 W  ← up by exactly 1200 W

    8. Press "It's on"
       → Step 3/5, the graph draws the step

    9. Let it run, don't switch anything else on
       → Recording for 3m 12s

   10. When it finishes, press "It's finished"
       → Step 4/5, Above the baseline: 1200 W
         "Still drawing power."

   11. SWITCH THE MICROWAVE OFF
       → (nothing on screen yet)

   12. Look at the difference box again
       → Above the baseline: 2 W
         "Looks like it's off now."

   13. Press "Done"
       → Step 5/5, green box: Run saved for Microwave

   14. Press "I'm done"
       → back to the appliance page

   15. Check the list
       → Microwave now reads Calibrated · 1 run


   ✅ RESULT
      The system has learnt that your microwave draws
      an extra 1200 W for about 3 minutes.
      That's all a teaching session does.


🔢  THREE NUMBERS WORTH REMEMBERING

      352 W  (step 3)
         What the house draws WITHOUT the microwave

      1552 W  (step 7)
         What it draws WITH the microwave

      1200 W  (1552 − 352)
         What the microwave alone draws
         ← the only figure that matters

   💡 Your numbers will be different. Every house has
      its own baseline, and it drifts by a few tens of
      watts on its own. That's fine — the DIFFERENCE
      is what counts.


🎯  WHICH APPLIANCE TO DO FIRST

   • Start with something that draws a lot and
     switches cleanly:
     kettle, microwave, toaster, heater

   • Leave the air conditioner and fridge for later.
     Their power moves around constantly, so they're
     harder to learn and need more sessions

   • Washing machines and dishwashers work fine, but
     you have to wait out a real cycle (45–70 minutes).
     Pick a time when you're not in a hurry


🚪  GETTING INTO THE GUIDE

   Two ways:

      • Appliances → click the appliance →
        "Start calibration" at the top

      • Dashboard → "Start calibration" →
        pick the appliance in the dialog


━━━ STEP 1 — "Make sure [name] is off." ━━━━━━━━━━━━━

   On screen:

      Step 1 / 5

      Make sure Microwave is off.
      WattWiser needs a few quiet seconds to learn
      what your home draws without it.

      ┌──────────────────────────────────────────┐
      │  Total power right now            352 W  │
      │                                          │
      │  Steady at about 352 W. Good to go.      │
      └──────────────────────────────────────────┘

                        [ Cancel ]  [ I'm ready ]


   🔒 This step is a latch on the door.
      "I'm ready" stays locked until the whole-house
      power agrees to sit still.

   Why lock it?

      If someone puts the kettle on at the moment you
      start the microwave, the step will be
      1200 + 2200 = 3400 W, and the system will be
      convinced the microwave draws 3400 W.

      Get it wrong here and it stays wrong forever,
      WITH NO ERROR MESSAGE.

   "Sitting still" means:
      Over 5 seconds in a row, the highest reading
      minus the lowest must be under 50 W.


   The line under the power box changes:

      ⬜ Still gathering readings
         "Checking that nothing else is switching on…
          3 of 5 seconds."

      🟨 Something else is running
         "Hold on — something else is running. Power is
          moving by 180 W; it needs to settle within 50 W."

      🟩 Ready
         "Steady at about 352 W. Good to go."

      🟥 Lost the meter
         "Can't reach the meter. Check the connection."


   For a Variable load appliance there's an extra note:
      "This type of appliance changes its power while
       running, so it is harder to identify. Plan on a
       few extra runs."

   Press "I'm ready" once the line is green.


━━━ STEP 2 — "Turn [name] on as you normally would." ━

   This is where the record is opened. Pressing
   "I'm ready" saved two things: the START TIME and
   the BASELINE it just measured.

   On screen:

      Step 2 / 5

      Turn Microwave on as you normally would.
      Avoid switching on other appliances for the
      next 2 minutes.

      ┌──────────────────────────────────────────┐
      │  Baseline captured          [Recording]  │
      │  Your home was drawing 352 W before      │
      │  switching on.                           │
      └──────────────────────────────────────────┘

      Live: 1552 W
                        [ Cancel ]  [ It's on ]


   Now go and switch the appliance on, exactly the way
   you always use it. For a microwave, press start.

   Back at the screen, "Live" has jumped from 352 to
   about 1552 W. Press "It's on".

   💡 What is the "baseline"?
      What your house draws when NOBODY is doing
      anything — the fridge running, the router lit,
      the standby lights. Everything from here is
      measured AGAINST it, not as a total.


   The wording changes by appliance type:

      • Simple
        "Turn Microwave on as you normally would."

      • Multi-stage
        "Start a normal cycle now — the one you use
         most often."

      • Variable load
        "Turn Air conditioner on and set it as you
         normally would."

   💡 For a washing machine, "switch it on" isn't enough.
      You have to run the cycle you actually use most,
      because every cycle has a different power shape.


━━━ STEP 3 — "Recording…" ━━━━━━━━━━━━━━━━━━━━━━━━━━━

   On screen:

      Step 3 / 5

      Recording…
      Leave it running. Avoid switching on other
      appliances.

      [Recording]              Recording for 1m 24s

      ┌──────────────────────────────────────────┐
      │  Power while recording                   │
      │       ┌───────────────────────           │
      │       │                                  │
      │   ────┘                                  │
      └──────────────────────────────────────────┘

      Baseline before switching on: 352 W
                     [ Cancel ]  [ It's finished ]


   The graph draws in real time. The step is
   unmistakable.

   For Multi-stage appliances there's an extra note:
      "A full cycle may take 45–70 minutes. You can
       leave this page open."


━━━ STEP 4 — "Wait for it to finish, then switch off." ━

   On screen:

      Step 4 / 5

      Wait for it to finish, then switch it off.
      Press Done only once it has switched off, so the
      recording ends where the appliance does.

      [Recording]              Recording for 3m 12s

      ┌──────────────────┬───────────────────────┐
      │ Total power now  │  Above the baseline   │
      │     1552 W       │       1200 W          │
      │                  │  Still drawing power. │
      └──────────────────┴───────────────────────┘

                             [ Cancel ]  [ Done ]


   The "Above the baseline" box is a genuinely
   useful guide:

      • 50 W or more  →  "Still drawing power."
      • under 50 W    →  "Looks like it's off now."

   Now switch the appliance off. The difference drops
   from 1200 W to about 2 W, and the line changes to
   "Looks like it's off now".

   ⚠️ What's it for? So you don't press Done too early.
      Press early and the recording gets cut short, and
      the system learns your microwave only runs for
      one minute.

   Press "Done".

   For Multi-stage, step 4 reads differently:
      "Leave it running to the end of the cycle, then
       press Done."
      with the note "This may take 45–70 minutes."


━━━ STEP 5 — "Complete" ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   On screen:

      Step 5 / 5

      Complete
      Run calibration again? Three to five runs gives
      the best result.

      ┌──────────────────────────────────────────┐
      │  Run saved for Microwave      [Complete] │
      │  Recorded for 3m 12s · baseline 352 W    │
      └──────────────────────────────────────────┘

      Each run teaches WattWiser a little more about
      what Microwave looks like. You can come back and
      add runs any time.

                   [ I'm done ]  [ Yes, run again ]


      • "Yes, run again"  →  back to step 1, fresh record
      • "I'm done"        →  back to the appliance page


🛑  STOPPING HALFWAY

   "Cancel" is on every step. From step 2 onwards it
   opens a dialog:

      Stop this calibration?
      This run is discarded. Nothing already saved for
      Microwave is affected.
      [ Keep going ]  [ Stop and discard ]

   That session is marked as discarded.
   Anything already saved is untouched.


✅  WHEN IT'S DONE

   • A confirmation pops up: "Calibration saved"
   • The label goes from Not Calibrated
     → Calibrated · 1 run
   • Calibration history has a new row


📼  WHAT A SESSION ACTUALLY SAVES

   This is where people get confused. A session does
   NOT work out the "1200 W" figure itself.

   It records exactly THREE things:

      1. What time it started
      2. What time it ended
      3. What the house was drawing before you
         switched on

   Like marking a stretch of a video recording and
   writing a note in the margin: "this bit is the
   microwave."

   Rewinding that stretch and pulling out the 1200 W
   figure is a later job — a part that isn't built yet,
   currently stood in for by sample data.

   ➜ So those three numbers are the most important
     thing this screen produces. Mark the wrong stretch
     and everything downstream is wrong.


⚠️  WORTH KNOWING

   One session = exactly one record
      Never more. Close the page halfway and start
      again, and the system automatically drops the
      old one first.

   The latch protects you
      Teaching the microwave (1200 W) while someone
      plugs in the kettle (2200 W):

         Should be    →  1200 W jump  →  correct ✅
         Contaminated →  3400 W jump  →  wrong ❌

      From then on, every microwave run gets filed
      under "Unknown". One dirty session ruins
      everything downstream, silently.

   Times are stored in a worldwide standard
      Start at 3pm and internally it's recorded as a
      different hour. The SCREEN still shows 3pm —
      only the stored copy is converted.
      Why the fuss? If different parts stored time
      differently, rewinding to the marked stretch
      would land in the wrong place.

   Elapsed time follows the readings, not your clock
      "Recording for 3m 12s" is counted from the
      timestamp of the latest reading, not your
      device's clock. If data stops flowing, the
      counter stops too — which is more honest.

   Variable load appliances need more sessions
      Air conditioners and fridges change their power
      constantly, so one session isn't enough.
      Step 1 warns you in advance.


📖  SOME WORDS, IN PLAIN LANGUAGE

   • Baseline
     What your house draws when nobody is doing anything

   • Signature
     An appliance's own way of drawing power:
     how many watts, for how long

   • Calibration
     One session where you switch an appliance on
     so the system can watch

   • Run
     One pass through the guide, step 1 to step 5

   • Discarded
     A session you stopped halfway; it doesn't count

   • Event
     A time the system later spotted an appliance
     running, by itself

   • Reading
     One power measurement, taken every second


🔧  IF THE POWER WON'T SETTLE

   At step 1, if the line stays amber:

      1. Look around for something that just switched
         itself on: fridge, air conditioner, hot water
      2. Wait for it to finish its cycle, then try again
      3. Just wait — the latch only needs 5 quiet seconds


➡️  NEXT

   4️⃣  Dashboard  →  04-dashboard.md
