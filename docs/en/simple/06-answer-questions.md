6️⃣  ANSWER QUESTIONS
════════════════════════════════════════

Screen: /confirm


📌  WHAT IT DOES

   When the system works out an appliance but isn't
   confident, it asks you:

      "We detected a 1.8 kW appliance running between
       7:15 pm and 8:05 pm. Was this your dishwasher?"

   • You pick one of four answers
   • Each answer is kept as "labelled data"


📱  THINK OF THE PHOTO APP ON YOUR PHONE

   Your phone occasionally asks:
   "Is this Auntie May?" next to a slightly blurry photo.

   It doesn't ask about the clear ones — those it
   already recognised. It only asks about the ones
   it's UNSURE of.

   You tap "yes", and next time it recognises her
   slightly better.

   ➜ This screen is exactly that, for appliances.


🏷️  WHAT "LABELLED DATA" MEANS

   A piece of data with the right answer attached.

   Without a label:

      "At 7:15pm on 11 Sep something drew 1.8 kW
       for 50 minutes"

   With a label:

      "...and IT WAS THE DISHWASHER —
       the householder confirmed it"

   The first is just a number.
   The second is A LESSON.

   Machines can only learn from the second kind, and
   the second kind only exists when a PERSON tells them.

   ➜ Every button you press here creates one lesson.


🕐  WHEN TO USE IT

   • When the dashboard shows "runs need checking"
   • Any time you feel like helping the system
     guess better


🤨  WHY IT EXISTS BEFORE ANYTHING USES IT

   The most interesting thing about this screen.

   🚨 In the current version, NOTHING reads these
      answers back yet. Your answers are saved and...
      they sit there.

   So why build it?

      Because it's labelled data — the single most
      valuable thing to have when you later want to
      train a recognition model.

      And collecting it is nearly free: you're already
      looking at the screen, you just press a button.

   ➜ Build it later and you've lost every month that
     went by. Build it now and the data starts piling
     up from today.

   The principle: collect early the thing you know
   you'll need.


🚪  GETTING TO THE SCREEN

   Two ways:

      • Click "Confirm" in the sidebar
      • Click "Check them" on the dashboard prompt
        ← the main way


👆  READING THE QUESTION

      5 runs to check

      ┌──────────────────────────────────────────────┐
      │  We detected a 1.8 kW appliance running      │
      │  between 7:15 pm and 8:05 pm.                │
      │                                              │
      │  Was this your dishwasher?                   │
      │                                              │
      │  11 Sep 2026, 7:15 pm · ran for 50m ·        │
      │  used 1.5 kWh                                │
      │                                              │
      │  ┌────────────────────────────────────────┐  │
      │  │          Yes, that was it              │  │
      │  └────────────────────────────────────────┘  │
      │  ┌────────────────────────────────────────┐  │
      │  │          No, it wasn't                 │  │
      │  └────────────────────────────────────────┘  │
      │  ┌──────────────────┐ ┌──────────────────┐   │
      │  │ Choose another   │ │  I don't know    │   │
      │  │ appliance        │ │                  │   │
      │  └──────────────────┘ └──────────────────┘   │
      └──────────────────────────────────────────────┘


   Each question gives you enough to jog your memory:

      • Power ......... 1.8 kW
      • Time window ... 7:15 pm to 8:05 pm
      • Date .......... 11 Sep 2026
      • Duration ...... ran for 50m
      • Energy ........ used 1.5 kWh


👆  THE FOUR ANSWERS

   ✔️  "Yes, that was it"
       The guess was correct
       Kept as: "correct" + the appliance it guessed

   ✖️  "No, it wasn't"
       Wrong guess, and I don't know what it was
       Kept as: "wrong", no name attached

   🔄  "Choose another appliance"
       Wrong guess, and I know what it really was
       Kept as: "wrong" + the appliance you pick
       → Opens a list of your appliances, with the
         guessed one removed

   ❔  "I don't know"
       I can't remember
       Kept as: "don't remember", no name attached


✏️  A WORKED EXAMPLE — WHICH BUTTON?

   The question on screen:

      "A 1.8 kW appliance ran from 7:15pm to 8:05pm
       on 11 Sep — was this your dishwasher?"

   You think back to that evening.


   You remember: "Yes, I put the dishwasher on
                  after dinner."
   → Press "Yes, that was it"
   ✅ Right guess — more confident next time


   You remember: "No, the dishwasher wasn't on.
                  No idea what it was though."
   → Press "No, it wasn't"
   ✅ One possibility ruled out


   You remember: "Not the dishwasher — I did a load
                  of washing that evening."
   → Press "Choose another appliance" → Washing machine
   ✅ Best of all: rules one out AND names the right one


   You remember: "The 11th? No idea."
   → Press "I don't know"
   ⚠️ Noted, but teaches nothing


   🚨 DON'T BE SHY ABOUT "I DON'T KNOW".
      Saying you can't remember beats guessing.
      A wrong answer is WORSE than no answer,
      because the system will believe it.

   💡 A trick for remembering:
      Look at the time and the duration.
      7:15pm, ran 50 minutes, 1.8 kW — after dinner,
      nearly an hour, fairly hungry.
      A dishwasher or washing machine fits.
      A kettle doesn't (a kettle runs 3 minutes).


🔁  KEEPING GOING

   When you answer, the next question appears
   immediately.

   The counter ticks down:
      5 runs → 4 runs → … → 1 run

   When they're all done:

      All caught up
      Thanks — 5 answers saved. New questions appear
      when WattWiser isn't sure about a run.
      [ See the breakdown ]


✅  WHEN IT'S DONE

   • A small note pops up: "Thanks — that helps"
   • The counter drops by one
   • The next question appears
   • At the end: "All caught up"
   • The dashboard prompt disappears


🚨  ONE RUN, ONE ANSWER, AND THAT'S FINAL

   Once answered, the system refuses to overwrite.
   Your first answer is your only answer.

   Why so strict?

      This is training data. Letting it be edited over
      and over would devalue it — you'd no longer know
      which answer was the person's real intent.

   It's handled smoothly: if you somehow answer twice
   (two tabs open, say), the question still leaves the
   queue normally, with no error shown.


🤔  WHY IS THE SYSTEM "UNSURE" IN THE FIRST PLACE?

   A fair question. It's unsure for perfectly
   ordinary reasons:

      • The dishwasher and washing machine are
        VERY ALIKE
        similar power, both run long cycles

      • The appliance has only been TAUGHT ONCE
        the system has seen it exactly once and
        doesn't know its habits

      • It ran DIFFERENTLY THAN USUAL that day
        a hot wash instead of a cold one

      • TWO APPLIANCES went on close together
        their steps merged

   ➜ Three of those four improve a lot if you teach
     it a few more times (guide 3️⃣).
     That's why step 5 keeps nagging about
     "three to five runs".


⚠️  IT ONLY ASKS ABOUT RUNS IT ALREADY HAS A GUESS FOR

   A run reaches the queue only if ALL THREE are true:

      1. The system worked out a specific appliance
      2. But it isn't confident about that guess
      3. And nobody has answered this run yet

   🚨 Runs it couldn't place at all are NOT asked about.

      There's no guess to confirm. The question would
      become "what was this?" rather than "was this X?",
      which is a completely different experience.

   💡 This is the most obvious place to extend later:
      ask about unplaceable runs too, as a different
      kind of question.


⚠️  ODDS AND ENDS

   The queue is capped at 25
      Newest first. Nobody wants to open this screen
      and find 300 questions waiting.

   "No" and "I don't know" are different
      • "No, it wasn't"
        = "definitely not the dishwasher"
        → USEFUL information
      • "I don't know"
        = "the person can't remember"
        → can't be used as a label
      Both are saved. They're two different things
      and shouldn't be merged.

   Why one question at a time
      Not a list with tick boxes. One question,
      one screen.
      Answering this kind of question takes REMEMBERING.
      You have to think back to that evening.
      A long list encourages clicking through just to
      be done — and careless clicking produces data
      that's worse than no data.


➡️  THAT'S THE END OF THE USER GUIDE

   The next two pages are not for normal users:

   7️⃣  Demo switches  →  07-demo-switches.md
   8️⃣  Put a change live  →  08-put-a-change-live.md
