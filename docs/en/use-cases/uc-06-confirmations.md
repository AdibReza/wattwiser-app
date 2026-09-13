# UC-06 · Answer questions

**Screen:** `/confirm`
**For:** the household

---

## What this screen does

When the system **works out an appliance but isn't confident**, it asks you:

> *"We detected a 1.8 kW appliance running between 7:15 pm and 8:05 pm. Was this
> your dishwasher?"*

You pick one of four answers. Each answer is kept as **labelled data**.

### Think of the photo app on your phone

Your phone occasionally asks: *"Is this Auntie May?"* next to a slightly blurry
photo. It doesn't ask about the clear ones — those it already recognised. It only
asks about the ones it's **unsure** of.

You tap "yes", and next time it recognises her slightly better.

**This screen is exactly that, for electrical appliances.** The system only asks
about runs it isn't sure of; you answer; it gets better.

### What "labelled data" means

A piece of data **with the right answer attached**.

| Without a label                                              | With a label                                                        |
|--------------------------------------------------------------|---------------------------------------------------------------------|
| *"At 7:15pm on 11 Sep something drew 1.8 kW for 50 minutes"* | *"...and **it was the dishwasher** — the householder confirmed it"* |

The first is just a number. The second is **a lesson**. Machines can only learn
from the second kind, and the second kind only exists when **a person tells
them**.

Every button you press on this screen creates one lesson.

---

## When to use it

- When the dashboard shows the *"runs need checking"* prompt
- Any time you feel like helping the system guess better

### Why it matters — and why it exists before anything uses it

The most interesting thing about this screen.

**In the current version, nothing reads these answers back yet.** Your answers
are saved and... they sit there.

**So why build it?**

Because it's **labelled data** — the single most valuable thing to have when you
later want to train a recognition model. And collecting it is **nearly free**:
you're already looking at the screen, you just press a button.

> Build it later and you've lost every month that went by. Build it now and the
> data starts piling up from today.

The principle: **collect early the thing you know you'll need.**

---

## Steps

### 1 — Get to the screen

Two ways:

1. Click **Confirm** in the sidebar
2. Click **Check them** on the dashboard prompt ← the main way

### 2 — Read the question

```
   5 runs to check

   ┌────────────────────────────────────────────────────┐
   │  We detected a 1.8 kW appliance running between    │
   │  7:15 pm and 8:05 pm.                              │
   │                                                    │
   │  Was this your dishwasher?                         │
   │                                                    │
   │  11 Sep 2026, 7:15 pm · ran for 50m · used 1.5 kWh │
   │                                                    │
   │  ┌──────────────────────────────────────────────┐  │
   │  │            Yes, that was it                  │  │
   │  └──────────────────────────────────────────────┘  │
   │  ┌──────────────────────────────────────────────┐  │
   │  │            No, it wasn't                     │  │
   │  └──────────────────────────────────────────────┘  │
   │  ┌───────────────────────┐ ┌───────────────────┐   │
   │  │ Choose another        │ │  I don't know     │   │
   │  │ appliance             │ │                   │   │
   │  └───────────────────────┘ └───────────────────┘   │
   └────────────────────────────────────────────────────┘
```

Each question gives you enough to jog your memory:

| Detail      | Example                |
|-------------|------------------------|
| Power       | `1.8 kW`               |
| Time window | `7:15 pm` to `8:05 pm` |
| Date        | `11 Sep 2026`          |
| Duration    | `ran for 50m`          |
| Energy      | `used 1.5 kWh`         |

### 3 — Pick one of four

| Button                       | Meaning                                    | What gets kept                       |
|------------------------------|--------------------------------------------|--------------------------------------|
| **Yes, that was it**         | Correct guess                              | "correct" + the appliance it guessed |
| **No, it wasn't**            | Wrong guess, and I don't know what it was  | "wrong", no name attached            |
| **Choose another appliance** | Wrong guess, and I know what it really was | "wrong" + the appliance you pick     |
| **I don't know**             | I can't remember                           | "don't remember", no name attached   |

Choosing **Choose another appliance** opens a dialog:

> **Which appliance was it?**
> Pick the one that was actually running at that time.
> *(your appliance list, with the guessed one removed)*

#### A worked example: which button?

The question on screen:

> *"A 1.8 kW appliance ran from 7:15pm to 8:05pm on 11 Sep — was this your
> dishwasher?"*

You think back to that evening. Four situations, four buttons:

| What you remember                                              | Press                                                 | What the system gets                                  |
|----------------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------------|
| *"Yes, I put the dishwasher on after dinner."*                 | **Yes, that was it**                                  | ✅ Right guess — more confident next time             |
| *"No, the dishwasher wasn't on. No idea what it was though."*  | **No, it wasn't**                                     | ✅ One possibility ruled out                          |
| *"Not the dishwasher — I did a load of washing that evening."* | **Choose another appliance** → pick `Washing machine` | ✅ Best of all: rules one out and names the right one |
| *"The 11th? No idea."*                                         | **I don't know**                                      | ⚠️ Noted, but teaches nothing                       |

**Don't be shy about "I don't know".** Saying you can't remember beats guessing —
a wrong answer is worse than no answer, because the system will believe it.

> 💡 **A trick for remembering:** look at the time and the duration. *7:15pm, ran
> 50 minutes, 1.8 kW* — after dinner, nearly an hour, fairly hungry. A dishwasher
> or a washing machine fits; a kettle doesn't (a kettle runs 3 minutes).

### 4 — Keep going

When you answer, the next question appears immediately. The counter ticks down:
`5 runs` → `4 runs` → … → `1 run`.

When they're all done:

> **All caught up**
> Thanks — 5 answers saved. New questions appear when WattWiser isn't sure about
> a run.
> [ See the breakdown ]

---

## When it's done

- A small note pops up: **"Thanks — that helps"**
- The counter drops by one
- The next question appears
- At the end you get **"All caught up"**
- The prompt on the dashboard disappears

---

## Worth knowing

### ⚠️ One run, one answer, and that's final

Once answered, the system **refuses to overwrite**. Your first answer is your
only answer.

**Why so strict:** this is training data. Letting it be edited over and over
would devalue it — you'd no longer know which answer was the person's real
intent.

It's handled smoothly: if you somehow answer twice (two tabs open, say), the
question still leaves the queue normally, with no error shown. You don't need to
know anything happened.

### Why the system is "unsure" in the first place

A fair question for a newcomer. It's unsure for perfectly ordinary reasons:

| What happened                                         | Why it's hard                                                   |
|-------------------------------------------------------|-----------------------------------------------------------------|
| The dishwasher and washing machine are **very alike** | similar power, both run long cycles                             |
| The appliance has only been **taught once**           | the system has seen it exactly once and doesn't know its habits |
| It ran **differently than usual** that day            | a hot wash instead of a cold one                                |
| **Two appliances went on close together**             | their steps merged                                              |

Three of those four improve a lot if you **teach it a few more times**
([UC-03](./uc-03-calibration.md)). That's why step 5 keeps nagging about "three
to five runs".

### ⚠️ It only asks about runs it already has a guess for

A run reaches the queue only if **all three** are true:

1. The system **worked out** a specific appliance
2. But it **isn't confident** about that guess
3. And **nobody has answered** this run yet

**Runs it couldn't place at all are NOT asked about.** There's no guess to
confirm — the question would become *"what was this?"* rather than *"was this
X?"*, which is a completely different experience.

> 💡 This is the most obvious place to extend if you later want more data: ask
> about unplaceable runs too, as a different kind of question.

### The queue is capped at 25

Newest first. Nobody wants to open this screen and find 300 questions waiting.

### "No" and "I don't know" are different

| Answer            | What the system learns                                     |
|-------------------|------------------------------------------------------------|
| **No, it wasn't** | *"Definitely not the dishwasher"* — **useful** information |
| **I don't know**  | *"The person can't remember"* — can't be used as a label   |

Both are saved. They're two different things and shouldn't be merged.

### Why one question at a time

Not a list with tick boxes. **One question, one screen.**

The reason: answering this kind of question takes **remembering**. You have to
think back to that evening. A long list encourages clicking through just to be
done — and careless clicking produces data that's worse than no data.

---

**Next:** [UC-07 · Simulated switches](./uc-07-demo-controls.md)
