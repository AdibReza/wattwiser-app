5️⃣  WHERE THE MONEY GOES
════════════════════════════════════════

Screen: /breakdown

⭐ THIS IS THE END PRODUCT OF THE WHOLE SYSTEM.
   Everything else exists to produce this screen.


📌  WHAT IT DOES

   • Answers the question the project was born from:
     "where did last month's bill go?"
   • Gathers every run detected in a month
   • Groups them by appliance
   • Applies your prices
   • Lays it out as a ranking


📞  THINK OF IT LIKE AN ITEMISED PHONE BILL

   Old phone bills itemised every call: who you rang,
   what time, for how long, what it cost.
   One glance and you knew where the money went.

   Electricity bills don't do that. They give you
   one number:

      "You used 350 kWh this month. You owe $157."

   That's it. Nobody tells you how much of that was
   the air conditioner.

   ➜ This screen is the itemised bill, for electricity.

   ⚠️ With one important difference:
      The phone company KNOWS who you called.
      WattWiser GUESSES, from a single meter.

      That's why this screen always shows a confidence
      level, and always keeps a "don't know" row.
      That's where it's more honest than most software.


🕐  WHEN TO USE IT

   • When the bill arrives and you want to know why
     it's so high
   • At the end of the month, to compare with last month
   • When you're thinking about replacing an old appliance


👆  THE THREE SUMMARY TILES

      ┌───────────────┬───────────────┬───────────────┐
      │  Energy used  │   Estimated   │  Identified   │
      │               │     cost      │               │
      │   52.5 kWh    │    $15.74     │     72%       │
      │ September 2026│ Time of use,  │ 28% could not │
      │               │ $0.45 peak    │ be matched    │
      └───────────────┴───────────────┴───────────────┘

   ⚡  Energy used
       Total energy of every run detected in the month

   💰  Estimated cost
       The money, worked out from your prices.
       The line below names which tariff was used

   🎯  Identified
       What share could be traced to a specific appliance


   📖 Reading those three as a sentence:

      "In September the house used 52.5 units, costing
       about $15.74. I know which appliance 72% of that
       was. The other 28% is a mystery."

   💡 THE THIRD TILE IS THE VALUABLE ONE.
      Software that makes numbers up would always say
      100%. The 72% is a confession, and it tells you
      how much to trust the table below.


👆  THE RANKING

      Air conditioner  19.9 kWh  37.9%  $5.97  [Medium]
      Dishwasher       11.2 kWh  21.3%  $3.36  [High]
      Kettle            6.6 kWh  12.6%  $1.96  [High]
      Washing machine   4.2 kWh   8.0%  $1.26  [High]
      Unknown / Other  14.8 kWh  28.2%  $4.45  —
                                              ↑ always last

   On screen each row also has a bar:

      Air conditioner  ████████  37.9%
      Dishwasher       █████     21.3%
      Kettle           ███       12.6%

   Sorted most to least.

   Every row has a bar AND the percentage written out,
   so it still reads for someone who's colour-blind.


✏️  READING ONE ROW CLOSELY

   Take the top row.

      Air conditioner
         An appliance you declared yourself
         ← from your appliance list

      19.9 kWh
         Every time the AC ran this month, added up
         ← about 20 evenings × 2–4 hours

      37.9%
         19.9 ÷ 52.5, the month's total
         ← simple division

      $5.97
         19.9 kWh × the price, split peak / off-peak
         ← the tariff you entered

      [Medium]
         The system is FAIRLY sure, not certain
         ← see below


   📖 As a sentence:

      "Last month the air conditioner used nearly 20
       units, 38% of the bill, about $6. The system is
       reasonably confident it was the AC, but won't
       swear to it."


🤔  WHY THE KETTLE GETS "HIGH" AND THE AC ONLY "MEDIUM"

   • Kettle — type: Simple
     On → exactly 2150 W → 3 minutes → off.
     Same every single time.
     ➜ Very easy to spot → HIGH

   • Air conditioner — type: Variable load
     Constantly moving: 1400 W, then 800 W, then
     1200 W, depending on the weather.
     ➜ Hard to spot → MEDIUM

   💡 It's like recognising people by sound.
      A neighbour whose cough is always the same is
      easy — you hear it and you know.
      Someone who speaks loudly or softly depending on
      their mood, you can only say "probably him".


🕳️  WHAT'S INSIDE "UNKNOWN / OTHER"

   Nearly 15 kWh — 28% of the bill — that the system
   can't place. Usually three things:

      1. Appliances you haven't declared
         a fan, a hairdryer, a laptop charger

      2. Appliances declared but never taught
         they're on the list, but the system has
         never been shown them working

      3. Two appliances switched on together
         the steps blur into one and can't be separated

   ➜ HOW TO SHRINK THIS ROW:
     Declare more appliances (guide 2️⃣) and teach
     them more times (guide 3️⃣).
     That's exactly why those two screens exist.


📋  RECENT ACTIVITY

   Below the ranking: the last 20 runs detected.

      Kettle           11 Sep 2026, 7:02 am   0.11 kWh
      Dishwasher       10 Sep 2026, 8:30 pm   1.48 kWh
      Air conditioner  10 Sep 2026, 6:15 pm   2.90 kWh
      Unknown          10 Sep 2026, 3:41 pm   0.34 kWh


📅  CHANGING THE MONTH

   The month picker is at the top right.

   The month goes into the web address:

      /breakdown?month=2026-08

   💡 So you can send someone the link and they'll open
      the same month. It lives in the link itself, not
      in your browser's temporary memory.


✅  WHAT YOU'LL SEE

   With data and prices entered
      Everything: three tiles, the ranking with a cost
      column, recent activity.

   Without prices entered
      • Prompt: "Add your tariff to see costs"
      • Estimated cost shows —
      • The cost column disappears
      • ENERGY STILL SHOWS NORMALLY. Only money is missing.

   When a month has no data
      Empty screen: "Nothing detected in August 2026"
      with a "Go to appliances" button.


🚨  THE "UNKNOWN / OTHER" ROW IS ALWAYS SHOWN

   The single most important design decision here.

   That row:

      • Is ALWAYS there, even at 0 kWh
      • Is ALWAYS last, however big or small
      • Has NO confidence — the cell is blank, not "Low"

   Why not just hide it and keep things tidy?

      Hiding it would be a lie. It would present a world
      where every watt traces to an appliance, which
      isn't true.

      Better to admit 28% is unknown than to spread that
      28% across the other appliances and corrupt every
      figure.

   The "Identified" tile (72%) is the other side of
   the same coin.


🚨  CONFIDENCE IS NEVER SHOWN AS A NUMBER

   Internally the system scores from 0 to 1.
   On screen you only ever see three words:

      0.8 and above  →  High
      0.5 and above  →  Medium
      below 0.5      →  Low

   Why?

      0.73 looks like a MEASUREMENT.
      It isn't — it's a GUESS.
      "Medium" tells the truth better.

   A row's confidence is weighted BY ENERGY —
   a big run counts for more than a small one.


🚨  THESE ARE ESTIMATES, NOT MEASUREMENTS

   There's a line right under the ranking saying so:

      "These are estimates worked out from the
       whole-house meter, not measurements of each
       appliance."

   There is only ONE meter, at the main board.
   Every per-appliance figure is reasoning backwards.

   Put another way:

      There is no sensor attached to the air conditioner.
      The "19.9 kWh" is the system looking at the main
      meter, spotting 20 occasions with a step that
      looked like the AC, and adding them up.

      If one evening you ran the AC at the same time as
      the washing machine, there's a good chance both
      got merged into one and landed in "Unknown".

   ➜ That error is inherent to the method, not a bug.
     The only way to get exact figures is a separate
     meter on every socket — expensive and a nuisance,
     which is why WattWiser exists.


💰  HOW EACH KIND OF TARIFF IS WORKED OUT

   • Flat rate
     kWh × price. That's it.
     Example: 19.9 kWh × $0.30 = $5.97

   • Time of use
     Each run is sliced into 5-minute pieces, then it
     checks which pieces fall in peak hours.
     See the example below.

   • Tiered
     Tiers apply to the WHOLE MONTH, so every row is
     priced at the month's blended average.
     Example: first 500 units cheap, from 501 dearer


✏️  TIME OF USE, IN NUMBERS

   Say the AC runs 3 hours, 6pm to 9pm, using 3.5 kWh.
   Peak is 3pm–9pm, so all 3 hours are peak:

      3.5 kWh  ×  $0.45  =  $1.58

   Same air conditioner, same 3 hours, but running
   10pm to 1am — outside peak:

      3.5 kWh  ×  $0.22  =  $0.77

   🚨 SAME AMOUNT OF ELECTRICITY, TWICE THE MONEY.

   That's why this screen has to know WHAT TIME each
   run happened, not just the monthly total.


⚠️  TWO FIXED SETTINGS THE SETUP FORM DOESN'T ASK ABOUT

      1. Time zone: Australia/Sydney
      2. Peak hours: weekdays, 3pm–9pm

   Different time zone or different peak hours →
   the money will be off. A known limit of this
   first version.

   The pricing has its own automated check that runs
   every time a new version goes live. If the arithmetic
   is wrong anywhere, that version doesn't ship.


⚠️  ODDS AND ENDS

   Change your prices and old months change too
      This page recalculates every time you open it.
      Edit your prices today and last month's cost
      figures change with them.
      Deliberate: there is only ONE definition of your
      prices. No stale copy stuck from an earlier month.

   The month picker only lists months with data
      Not every month on the calendar. Only months
      that actually have runs recorded.


➡️  NEXT

   6️⃣  Answer questions  →  06-answer-questions.md
