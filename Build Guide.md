> For someone who has never written code and works by prompting Claude Code.
> Stack: **Next.js** on **Vercel**, **Supabase** for the database, **Claude Code** as the AI coding tool.
> Scope: input UI + dashboard + calibration wizard, running on mocked data. No authentication.
 
---
 
## Part 0 — How to work through this
 
Ask about anything, including things that seem obvious.
 
When stuck, **copy the error text exactly**. "It showed some error" is unusable — the wording is the only clue.
 
When given a prompt to paste, **paste it whole**. The length is deliberate.
 
**Standing style rule:** every screen must look **simple and modern**. Say this once to Claude Code when building the first screen and it carries the decision through the rest of the conversation. Ugly is never acceptable, even under time pressure.
 
---
 
## Part 1 — Twelve words you'll run into
 
| Term | What it actually means |
|---|---|
| **Repo** | A folder holding the code, stored on GitHub. Like Google Drive, but for code. |
| **Commit** | Saving a version, with a note attached. |
| **Push** | Sending your saved versions from your machine up to GitHub. |
| **Deploy** | Putting the code on the internet so it has a URL others can open. |
| **Localhost** | The site running only on your machine. Nobody else can reach it. |
| **Environment variable (env)** | Passwords and keys kept separately, outside the code. |
| **Connection string** | A long string containing the database address and password. Treat it as a house key. |
| **Migration** | The command that creates tables in the database. Run once, tables exist. |
| **Schema** | The blueprint of the tables: which tables, which columns, which types. |
| **API route** | A backend address, e.g. `/api/appliances`. The frontend calls it to fetch or save data. |
| **Seed** | Loading sample data into the database up front. |
| **Build** | The server compiling the code into something runnable. A failed build means it never went live. |
 
---
 
## Part 2 — Four accounts to create first
 
Twenty minutes, all free.
 
1. **GitHub** (github.com) — holds the code
2. **Vercel** (vercel.com) — hosts the site. Sign up with "Continue with GitHub"
3. **Supabase** (supabase.com) — the Postgres database. Also sign up with GitHub
4. **Claude** (claude.ai) — then install **Claude Code**
 
> Sign up for Vercel and Supabase **through GitHub**, not a separate email. They recognise each other later, which saves configuration.
 
**How Claude Code works:** it runs inside the project folder. Type what you want in plain language; it writes files, runs commands, and fixes its own errors. Your job is to paste the prompts, answer its questions, and verify each result. When it asks permission to run a command, read what it says it's about to do — if it matches the step you're on, approve it.
 
---
 
## Part 3 — The working rhythm
 
Two separate things — don't confuse them.
 
**Day one, once only:** get an empty page live on a real URL. This isn't building blind — the page is one line of text, there's nothing to verify beyond "does the text appear." Its real purpose is proving the *plumbing* works: GitHub connected, Vercel connected, permissions correct. That plumbing is what actually breaks for beginners, not the app code. Catching it on day one with nothing built is cheap; catching it in week three under six features is not.
 
**Every feature after that, in this order:**
 
1. Claude Code builds it
2. **Test it on localhost.** Click through it. Broken? Tell Claude Code what's wrong and let it fix it — don't push yet
3. Working locally → ask Claude Code to commit and push
4. Open Vercel, confirm the deployment went **green**
5. Open the **live URL** and click through the same feature there
 
A green build only means the code compiled, not that it behaves correctly. Never push something untested on localhost. Never stack new work on a red build.
 
---
 
## Part 4 — The nine steps
 
Each step ends with a way to verify. Don't move on until it passes.
 
### Step 1 — Deploy an empty page
 
Create a new empty folder, open Claude Code in it, paste:
 
```
I don't know how to code. Walk me through this one step at a time
and explain everything in plain language.
 
Create a new Next.js project (App Router, TypeScript, Tailwind).
The homepage just needs to display the text "WattWiser".
 
Then show me how to:
1. Push this project to GitHub
2. Deploy it to Vercel
 
For every command, tell me exactly where to type it and what a correct
result looks like.
Don't do several steps at once — wait for me to confirm each one.
```
 
**Verify:** a `xxx.vercel.app` URL showing "WattWiser". No URL yet → do not continue.
 
---
 
### Step 2 — Create the database and connect it
 
Go to supabase.com → **New Project**. Set a database password and save it somewhere safe.
 
When it's ready, click **Connect** at the top → find the **Transaction pooler** connection string and copy it. (Supabase shows several; the Transaction pooler one is the right fit for Vercel and avoids "too many connections" errors.) Replace `[YOUR-PASSWORD]` in the string with the password you just set.
 
In Claude Code:
 
```
Connect this project to a Postgres database on Supabase.
My connection string is: [paste it here]
 
This is the Transaction pooler connection string from Supabase —
configure the database client accordingly.
 
Use Drizzle ORM (simpler than Prisma for a beginner).
 
Explain to me:
- What the .env file is for
- Why it must never be pushed to GitHub
- What I need to configure on Vercel so the deployed version connects too
 
Step by step, waiting for my confirmation.
```
 
> ⚠️ **The connection string is a password.** Not in the code, not on GitHub, not in a group chat.
 
**After adding environment variables on Vercel, hit Redeploy.** Vercel doesn't pick them up automatically.
 
**Verify:** deployment still green, page still loads.
 
---
 
### Step 3 — Create the tables
 
Open `02-schema-and-contract.md`, copy the whole Schema section, then paste:
 
```
Here is the database schema for this project.
Create the matching Drizzle schema files and run the migration to
create the real tables on Supabase.
 
[paste the Schema section from file 02 here]
 
Once it's done, show me how to view the created tables inside Supabase
so I can verify it myself.
```
 
**Verify:** Supabase → **Table Editor** → 8 tables present.
 
> Confirm the schema with the data side before running this. It's the contract between the two sides — neither changes it alone.
 
---
 
### Step 4 — Household setup form
 
The core input screen. Field list is in `01-screens-and-inputs.md` §1.
 
```
This app has no users and no login — it serves one household.
The homepage should redirect to /dashboard.
 
Build a /setup page: a form for the household profile, saving to the
single row in the household table.
 
Fields:
[paste the field table from file 01, section 1]
 
Requirements:
- If no household row exists yet, create it on first save
- The form is editable at any time, pre-filled with saved values
- Create the API routes GET /api/household and PUT /api/household
- Clean, simple, modern layout with Tailwind — not ugly, not cluttered.
  This is the visual tone for every screen we build after this one.
 
Build it step by step and wait for me to test.
```
 
**Verify:** fill the form, reload the page — values still there. Check the `household` table in Supabase has one row with your answers.
 
---
 
### Step 5 — Appliances
 
Field list in `01-screens-and-inputs.md` §4.
 
```
Build appliance management.
 
/appliances page:
- List of all appliances (single household, no user filtering)
- Each row: name, category, and "Calibrated" or "Not Calibrated"
- If calibrated, show the run count, e.g. "Calibrated · 3 runs"
- "+ Add Appliance" button
 
/appliances/new page, with these fields:
[paste the field table from file 01, section 4]
 
"Appliance class" is a dropdown: simple / multi-stage / variable-load.
It will control the calibration wizard's wording later, so store it.
 
"Start Calibration" saves the appliance, then goes into the wizard.
 
/appliances/[id] page: edit the same fields, plus a calibration history
list (one row per session: date, duration, status).
 
Create the matching API routes writing to the appliances table.
```
 
**Verify:** add an appliance, see it in the list, and see the row in Supabase.
 
---
 
### Step 6 — Mock data generator
 
Before the dashboard — without numbers there's nothing to display.
 
```
Write a fake electricity data generator that simulates a Shelly EM
measuring total household power.
 
Requirements:
- A baseline drifting between 300–400W (fridge, router, standby)
- Simulated appliances that can be switched on and off:
  Kettle 2200W, Washing machine 2000W, Microwave 1200W, Air conditioner 1500W
- When an appliance is "on", add its wattage to the total
- Add random noise of ±20W
- Produce a value every second
 
Also build a /dev page where I can toggle each simulated appliance
on and off, for use during demos.
 
Do not hardcode a fixed number.
```
 
**Verify:** open `/dev`, switch the kettle on → total power jumps to around 2500W.
 
---
 
### Step 7 — Dashboard
 
```
Build the /dashboard page:
 
- Large tile: Current Power (W), updating every second
- Tile: Today's Energy (kWh)
- Tile: Device Status — Connected / Not Connected, from the devices table
- Tile: appliance count, e.g. "6 appliances · 4 calibrated"
- Line chart of power over the last 60 seconds
- Two buttons: Add Appliance, Start Calibration
- If the household row is empty, show a prompt to complete /setup
 
Pull the numbers from the mock generator built in the previous step.
Keep the same clean, simple, modern visual style.
```
 
**Verify:** numbers move every second; toggling an appliance in `/dev` moves the chart.
 
---
 
### Step 8 — Calibration wizard (the core)
 
```
Build a 5-step Calibration Wizard at /calibration/[applianceId],
one screen per step.
 
Step 1: "Make sure [appliance name] is OFF".
        Check whether total power is stable (varying by less than 50W
        over 5 seconds). If it's fluctuating, show "Hold on — something
        else is running". If stable, enable the "I'm Ready" button.
 
Step 2: "Turn [appliance name] on as you normally would".
        On entering this step, call POST /api/calibration/start,
        saving started_at and baseline_w to calibration_sessions.
        Show the reminder: "Avoid switching on other appliances
        for the next 2 minutes".
 
Step 3: "Recording..." with a live power chart.
 
Step 4: "Wait for it to finish, then switch it off" + a "Done" button.
 
Step 5: "Complete". Call POST /api/calibration/:id/finish to save
        ended_at. Ask "Run calibration again?" — Yes / I'm done.
 
The wording of steps 2 and 4 changes with the appliance's class:
- simple: as written above
- multi_stage: step 2 says "Start a normal cycle now — the one you use
  most often". Step 4 says "Leave it running to the end of the cycle,
  then press Done", and warns this may take 45-70 minutes.
- variable_load: step 2 says "Turn it on and set it as you normally
  would", and notes on screen that this appliance type is harder to
  identify and may need more calibration runs.
 
Hard requirements:
- Each wizard run creates exactly ONE new row in calibration_sessions
- A Cancel button on every step, calling POST /api/calibration/:id/discard
- All timestamps stored in UTC
 
Build it one step at a time, explain as you go, and wait for me to test
before continuing.
```
 
**Verify:** run the wizard twice → `calibration_sessions` in Supabase has two rows, both with `started_at` and `ended_at`. Then run it once for a multi-stage appliance and confirm the wording changes.
 
---
 
### Step 9 — Seed the demo data
 
This is what saves the demo. Don't skip it.
 
```
Write a seed script that loads sample data into the database.
 
This data stands in for what the Python data service will eventually
produce, so it must go into the same tables it will write to:
readings, events, appliance_signatures.
 
- One household row, fully filled in
- One device row, status "connected"
- 6 appliances across the three classes, 4 of them calibrated
  (3 calibration_sessions each, plus an appliance_signatures row)
- 30 days of events reflecting realistic household habits:
  kettle in the mornings, air conditioner in the evenings,
  washing machine twice a week, plus some events with
  appliance_id = null for the Unknown bucket
- A few unconfirmed events for the confirmation screen
 
Show me how to run this script, and how to reset and re-run it.
```
 
**Verify:** open the live URL — the dashboard and appliance list are full of data, not empty.
 
---
 
## Part 5 — Optional, if time allows
 
**Breakdown page** (`01-screens-and-inputs.md` §6) — per-appliance kWh, percent, cost from the household tariff, confidence labels, Unknown bucket always shown. Reads from `events`.
 
**Confirmation UI** (`01-screens-and-inputs.md` §7) — "Was this your dishwasher?" with Yes / No / Choose another / I don't know, writing to `event_confirmations`.
 
Both are cuttable. Neither is the skeleton.
 
---
 
## Part 6 — When something breaks
 
1. **Copy the error text in full** — the whole block, not a fragment
2. Paste it into Claude Code with: *"I got this error. Explain the cause in plain language, then fix it."*
3. Still stuck → pass it on, including what you did immediately before it appeared
 
### Three most common failures
 
**"Build failed" on Vercel** → Vercel → Deployments → click the red one → read the first red line. Copy that line verbatim.
 
**Works locally, broken on the live URL** → 90% of the time a missing environment variable on Vercel. Settings → Environment Variables → check they're all there → **Redeploy**.
 
**"connection refused" / "too many connections"** → probably using the direct connection string instead of the pooler. Tell Claude Code: *"Switch to the Supabase Transaction pooler connection string"*, and check the string in Vercel's environment variables is the pooler one too.
 
---
 
## Part 7 — Four things never to do
 
1. ❌ **Never push the `.env` file to GitHub.** Check `.gitignore` contains a `.env` line.
2. ❌ **Never paste the connection string into a group chat.** The data side gets its own database role — see `02-schema-and-contract.md`.
3. ❌ **Never run a database drop or reset command** without understanding it. Ask first.
4. ❌ **Never code for three days without pushing.** Push at least once a day.
 
---
 
## Part 8 — Demo preparation
 
At least a day before, not the morning of.
 
- [ ] Open the Vercel URL on a phone and confirm it loads
- [ ] Confirm the seeded data shows on the dashboard
- [ ] Run the demo twice, clicking in the exact order you'll use live
- [ ] Have `/dev` open in a separate tab for toggling simulated appliances
- [ ] **Screen-record the whole run** and save it offline. If the wifi dies, play the video
- [ ] Write the URL down on paper or in a note
 
### Five-minute demo script
 
1. Open the URL → dashboard full of 30 days of data *(0:30)*
2. Show the household setup — this is what narrows the search space *(0:30)*
3. Show the breakdown: air conditioning is the largest share *(1:00)*
4. Add an appliance live *(0:30)*
5. Run the calibration wizard, toggling that appliance in the `/dev` tab → the chart actually moves *(2:00)*
6. Back to the dashboard and the cost view *(0:30)*
 
Step 5 is the moment that lands. Rehearse it until it's smooth.
 
State plainly during the demo what is mocked: live readings and detected events. The screens, the database, and the calibration capture are real, and the mocked rows sit in the exact tables the real pipeline will write to.
 
---
 
## Part 9 — Priorities if time runs short
 
Cut from the bottom up.
 
| Priority | Item | Cuttable |
|---|---|---|
| 1 | Working deployment with a URL | No |
| 2 | Database wired up (8 tables) | No |
| 3 | Household setup form | No |
| 4 | Appliances CRUD | No |
| 5 | Mock generator + /dev | No |
| 6 | Dashboard | No |
| 7 | Calibration wizard | No |
| 8 | Seed data | No |
| 9 | Breakdown + cost | Yes — high value if kept |
| 10 | Confirmation UI | Yes — cut first |
| 11 | Generated insights and recommendations | Yes — cut first |
 
Items 1–8 are the skeleton and stay untouched. "Cuttable" never means shipping something ugly — it means skipping extra polish passes.
 
Authentication and multi-household support: future work, not this MVP.