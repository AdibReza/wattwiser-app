4️⃣  DASHBOARD
════════════════════════════════════════

Screen: /dashboard


📌  WHAT IT DOES

   • The app's main screen
   • Answers one question: how much electricity is my
     house using RIGHT NOW?
   • Four number tiles, a 60-second graph, and prompts
     when there's something to do


🏍️  FIRST — kW AND kWh ARE DIFFERENT

   Almost everyone mixes these up, and this whole
   screen turns on the difference.

   Think of a motorbike.

      SPEEDOMETER — 40 km/h
         = "Current power" — 2.6 kW
         Right this second, how fast you're going

      ODOMETER — 12 km
         = "Today's energy" — 12.4 kWh
         Since midnight, how far you've gone in total

   Three things follow:

      • Speed goes UP AND DOWN.
        Distance travelled ONLY INCREASES.

      • Ride at 40 km/h for an hour → 40 km.
        Draw 1 kW for 1 hour → 1 kWh.
        The "h" in kWh is the hour.

      • YOUR BILL IS CHARGED PER kWh, NOT PER kW.

   🚨 The example that makes it click:

      A kettle draws 2.2 kW — sounds enormous.
      But it runs 3 minutes → only 0.11 kWh.

      A fridge draws 0.15 kW — sounds tiny.
      But it runs around the clock → 3.6 kWh a day.

      ➜ The fridge costs MORE THAN 30× the kettle.

   💡 In short:
      kW  = how fast you're going
      kWh = how far you've gone
      Your bill only cares about the second one.


💰  THE SAME THING, IN MONEY

   The sample data prices peak power at $0.45/kWh.

   So "Today's energy: 12.4 kWh" means:

      12.4 kWh  ×  $0.45  =  $5.58

   ...spent on electricity since midnight.

   That's the whole reason this screen exists:
   turning an invisible number into one you can feel.


🕐  WHEN TO USE IT

   • It's where the app opens
   • When you want to know what the house is
     drawing right now
   • When you want to check the meter is still connected


👆  THE FOUR TILES

      ┌────────────┬────────────┬────────────┬────────────┐
      │  Current   │   Device   │  Today's   │ Appliances │
      │   power    │   status   │   energy   │            │
      │   2.6 kW   │[Connected] │  12.4 kWh  │     6      │
      │            │            │            │4 calibrated│
      └────────────┴────────────┴────────────┴────────────┘


   💚  Current power
       Whole-house power right now, shown in green
       = "how fast you're going"
       Updates every second

   🔌  Device status
       Whether the meter is still reporting
       = "is the meter still talking"
       Updates every second

   ⚡  Today's energy
       Total used since midnight
       = "how far you've gone today"
       × your price = money
       Updates periodically

   🔢  Appliances
       How many declared, and how many taught
       = "how many the system knows by sight"
       Updates when the page loads


   📖 Reading those four as a sentence:

      "The house is drawing 2.6 kW — fairly high, so
       something like a kettle or the AC must be on.
       The meter is still connected. Since midnight
       it's used 12.4 kWh, about $5.58. Six appliances
       are declared, but the system has only learnt
       four of them."

   💡 Green is only ever used for the live power figure.
      One colour, one meaning.


📈  THE GRAPH

      ┌──────────────────────────────────────────────┐
      │  Power over time            last 60 seconds  │
      │                                              │
      │  2.6kW ┤        ┌──────────────────          │
      │        │        │                            │
      │  350 W ┤────────┘                            │
      │        └────────────────────────────────►    │
      └──────────────────────────────────────────────┘

   The power line over the last 60 seconds.


✏️  A WORKED EXAMPLE — WATCH THE NUMBER JUMP

   Stand on this screen, then go and switch on
   something hungry.

    1. Switch nothing on, wait 10 seconds
       → Current power: ~352 W
       → graph: flat and low

    2. Switch on a kettle (2200 W)
       → Current power: ~2552 W within a second
       → graph: a vertical step

    3. Switch on the air conditioner too (1500 W)
       → Current power: ~4052 W
       → graph: a second step on top

    4. Switch the kettle off
       → Current power: ~1852 W
       → graph: drops one notch

    5. Switch the air conditioner off
       → Current power: ~352 W
       → graph: back to baseline


   🚨 THAT'S THE WHOLE PROBLEM, IN ONE MINUTE.

      At step 3 the meter sees exactly ONE number:
      4052 W.

      It does NOT know that's two appliances.
      It doesn't know which is 2200 and which is 1500.
      It just sees 4052.

      WattWiser's job is to reason backwards:

         Sees:       4052 W
         Knows:      baseline ~352 W
         Therefore:  3700 W belongs to appliances
         Looks up:   3700 = 2200 + 1500
                     → "kettle + air conditioner"

      And the thing it looks up is what you taught it
      in guide 3️⃣.

      ➜ No teaching, nothing to look up, and 4052 W
        stays 4052 W forever.


🔔  THE PROMPTS

   Two kinds can appear at the top:

      • "Finish setting up your home"
        Shows when your home isn't set up
        Button: "Complete setup"

      • "3 runs need checking"
        Shows when there are uncertain runs waiting
        Button: "Check them"


🎬  THE TWO QUICK ACTIONS

   Top right of the page:

      • "Start calibration"  ← the MAIN action
        Solid button. Opens the appliance picker,
        then the teaching guide

      • "Add appliance"  ← secondary
        Outlined button. Goes to the add form

   💡 A rule of this project: every screen has exactly
      ONE main action. Two buttons never compete for
      your attention.


✅  WHEN IT'S WORKING

   • Current power changes every second, around 350 W
     when the house is idle
   • Device status shows "Connected" in green
   • Today's energy shows a kWh figure
   • The graph has a line in it, not an empty box

   When you switch an appliance on:

   • Current power jumps within a second
   • The graph draws a vertical step


⚠️  WHAT "CONNECTED" REALLY MEANS

   There's no meter plugged into your house yet.
   The sensor here is SIMULATED, and it only wakes up
   when someone has the app open.

      An app tab is open
         → the browser asks every second
         → a number is produced
         → status tile: Connected ✅

      All tabs closed
         → nobody asks
         → nobody answers
         → after 10 SECONDS: Not Connected ❌

   Once a real meter is wired in this goes away —
   a real meter reports around the clock.

   ➜ What follows: keep a tab open. If you wander off
     for a coffee and come back, the tile may be red.
     Not a fault — nobody was asking while you were away.

   ➜ Also: power history only builds up while a tab is
     open. The 60-second graph only has data if you've
     had the page open for at least 60 seconds.


⚠️  "TODAY'S ENERGY" — WHOSE "TODAY"?

   "Today" starts at midnight on YOUR OWN DEVICE'S
   CLOCK — not midnight in London or on a server.

      • Look at 6am → small number, only six hours in
      • Look at 11pm → nearly a full day
      • At midnight → resets to zero and starts again

   Internally the system always stores times in a
   worldwide standard and converts to local time only
   at the moment of display.


⚠️  ZERO VERSUS A DASH

      —     means "no data yet"
            (still loading, or the connection dropped)

      0 W   means "there is data, and it's zero"

   You'll never see odd machine words on screen.


⚠️  ODDS AND ENDS

   The page title is your home's name
      Once your home is set up the title is its name,
      like "12 Smith St". Before that it's just
      "Dashboard".

   The prompt is the main way into the questions screen
      Most people reach it through the prompt, not the
      menu. That's deliberate — the system tells you
      when there's something to do, rather than making
      you go and check.


➡️  NEXT

   5️⃣  Where the money goes  →  05-where-the-money-goes.md
