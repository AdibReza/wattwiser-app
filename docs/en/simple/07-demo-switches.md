7️⃣  DEMO SWITCHES
════════════════════════════════════════

Screen: /dev

🔧 NOT A CUSTOMER SCREEN.
   For demoing and testing, before a real meter
   is installed.


📌  WHAT IT DOES

   • A panel with FOUR switches
   • Each one stands in for a simulated appliance
   • Flip one on and the power on the dashboard
     jumps within a second

   Instead of walking to the kitchen and plugging
   in a real kettle.


🕐  WHEN TO USE IT

   • Before looking at the dashboard, so the graph
     has a shape
   • While testing the teaching guide, in place of a
     real appliance
   • While developing, when you need numbers to move


⭐  WHY IT MATTERS

   🚨 Understand this screen before you try any
      of the others.

   With no switches on:

      • Power just drifts around 350 W
      • The graph is nearly a straight line
      • The teaching guide records a flat,
        meaningless stretch
      • Everything looks like the system is broken

   Flip one switch and it all comes alive.


👆  THE STEPS

   Click "Demo controls" in the lower part of the
   left sidebar.

      Demo controls
      Flip simulated appliances on and off. The live
      power on the dashboard follows within a second.

      Current power          2.6 kW

      ┌──────────────────────────────────────────┐
      │  Kettle                2200 W  [ ●——— ]  │
      │  Washing machine       2000 W  [ ———○ ]  │
      │  Microwave             1200 W  [ ———○ ]  │
      │  Air conditioner       1500 W  [ ———○ ]  │
      └──────────────────────────────────────────┘

      The house baseline drifts between 300 W and
      400 W on its own, with a little noise, like a
      real home with a fridge and standby loads.


🔌  THE FOUR SWITCHES

   • Kettle — 2200 W
     A big step, short

   • Washing machine — 2000 W
     A big step, long

   • Microwave — 1200 W
     A medium step, very short

   • Air conditioner — 1500 W
     A medium step, very long

   🚨 THAT'S ALL FOUR. There is no Toaster switch
      and no Fridge switch, even though those names
      appear in the appliance list.


📊  HOW THE NUMBER IS BUILT

      power = a baseline drifting 300–400 W
            + the total of every switch that's ON
            + random noise of ±20 W

   The baseline follows a slow wave, one cycle every
   10 minutes, around 350 W.

   It is NOT a fixed number — a real house never sits
   at exactly 350 W.


✏️  EXAMPLES

      Nothing on ................... ~330–370 W
      Kettle ....................... ~2530–2570 W
      Kettle + Air conditioner ..... ~4030–4070 W
      All four ..................... ~7250–7290 W


👀  SEEING THE EFFECT

   Open the dashboard in another tab.
   The power follows within 1 second.


⚠️  WHY SWITCH STATES ARE KEPT IN ONE SHARED PLACE

   You might think keeping them in the browser
   would be enough. It isn't, because:

      • You have this screen open in one tab and the
        dashboard in another — BOTH TABS MUST AGREE

      • The server works out the power from these
        states, so they have to live on the server

      • Close the browser and reopen it, and the
        switches are still as you left them


🚨  THIS IS NOT A CUSTOMER SCREEN

   It sits in the LOWER group of the sidebar, next to
   "Household setup", separated by a rule.

   Once a real meter is wired in, this screen
   disappears entirely.

   ➜ When demoing to a customer, SAY SO.
     Otherwise they'll assume the real product has
     remote on/off switches for their appliances.


➡️  NEXT

   8️⃣  Put a change live  →  08-put-a-change-live.md
