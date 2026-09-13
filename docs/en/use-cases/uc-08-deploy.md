# UC-08 · Put a change live

**Where:** a terminal + the Vercel dashboard + the real URL
**For:** whoever builds the project (**not** the end user)

---

> ⚠️ **This page is different from the other seven.** Those cover **using** the
> app and contain no jargon. This one covers **putting the app on the internet**,
> which means typing commands and using a few technical words. The table below
> translates every one of them.

## Words you'll meet on this page

| Word             | What it means                                                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| **Deploy**       | Put a new version from your machine onto the internet so others can see it                                                                         |
| **Build**        | The machine packaging the whole app into something runnable. **Green build** = packaged fine; **red build** = something's broken, it can't go live |
| **Vercel**       | The company renting you space on the internet. Your app lives there                                                                                |
| **Terminal**     | The black window on your machine where you type commands                                                                                           |
| **Commit**       | Marking a point in your changes, with a note saying what you changed                                                                               |
| **Push**         | Sending those marks from your machine up to the shared store                                                                                       |
| **GitHub**       | That shared store. Anything new pushed there makes Vercel repackage automatically                                                                  |
| **localhost**    | The test copy running on your own machine, only you can see it                                                                                     |
| **The real URL** | The public web address anyone can open: `wattwiser.vercel.app`                                                                                     |

**The whole process in one sentence:** *type a few commands locally to be sure
nothing's broken → push to the shared store → wait while it repackages itself →
open the real address and look at it with your own eyes.*

---

## What this covers

Taking a change from your machine to the internet, and **verifying** it actually
works there.

Six steps, in order, each with a clear "green" criterion. The project has a skill
called `ship-a-change` that runs exactly this.

---

## When to use it

- Whenever a feature, a fix, or a screen is finished
- When you tell Claude Code *"ship it"*

### Why there's a fixed process

Because of the **project's most important rule**:

> ⛔ **Never stack new work on a red build.**

If you write feature B while feature A is breaking the build, then when the build
goes red you don't know whether A or B caused it. Fixing one bug becomes
untangling a knot.

And there's one step **everybody skips** — step 5, opening the real URL. A green
build only means the code **compiles**. It does not mean the page **works**.

---

## Before you start

- A change that's finished and tested locally
- Docker Desktop running
- `just up` already run
- Signed in to git with the right account

> 💡 This project uses the GitHub account `hoaiphongdev`, configured per project.
> Don't use the `gh` command here.

---

## Steps

### 1 — Build on your machine

```
pnpm build
```

Or run the whole check suite:

```
just check
```

`just check` runs **three** things — exactly what Vercel will run:

| Command              | What it checks                                  |
|----------------------|-------------------------------------------------|
| `pnpm build`         | Does the code compile                           |
| `pnpm exec eslint .` | Any code style problems                         |
| `pnpm check:maths`   | **Is the electricity pricing arithmetic right** |

✅ **Green:** ends with a list of routes, nothing in red.
❌ **Red:** **stop here.** Fix it locally. Don't push a build that's already
broken — you'd only spend another 5 minutes waiting for Vercel to tell you the
same thing.

> 💡 Use `pnpm build`, not `pnpm dev`. The development server tolerates plenty of
> things Vercel will reject.

### 2 — Test on localhost

```
just up        # local database, if it isn't running
just migrate   # if the change includes a migration
just run
```

Open the page you changed and check the thing you changed **actually works**.
Then check the **two nearest screens** for breakage.

For anything with live numbers — dashboard, calibration guide — confirm the
**numbers are moving**. Frozen numbers mean the data generator isn't running.

### 3 — Commit and push

**One change, one commit.**

```
git add -A
git commit -m "✨ feat: add the confirmation screen"
git push
```

#### ⚠️ The commit format is mandatory

```
<emoji> <type>: <message>
```

| Emoji | Type       | Use for                                 |
|-------|------------|-----------------------------------------|
| ✨    | `feat`     | A new feature                           |
| 🐛    | `fix`      | A bug fix                               |
| 📝    | `docs`     | Documentation                           |
| 🎨    | `style`    | Appearance, formatting                  |
| ♻️  | `refactor` | Tidying code without changing behaviour |
| ✅    | `test`     | Tests                                   |
| 🔧    | `chore`    | Odd jobs, configuration                 |
| 🚀    | `deploy`   | Deployment                              |
| 🗃️  | `db`       | Database                                |

The `message` part: **imperative, lowercase, no full stop.**

| Right                                  | Wrong                         |
|----------------------------------------|-------------------------------|
| `✨ feat: add household setup form`    | `Added household setup form.` |
| `🐛 fix: correct peak window boundary` | `fix: Fixed the bug`          |
| `🎨 style: pin the sidebar`            | `update`                      |

### 4 — Wait for a green Vercel build

Open the Vercel dashboard. Wait for the deployment to finish.

✅ **Green:** carry on.
❌ **Red:** open the build log and read the **FIRST** error — not the last.
Everything after the first error is usually noise. **Don't start anything new
until it's green again.**

> 💡 The Vercel build **also runs migrations** against the hosted database (the
> `vercel-build` script is `drizzle-kit migrate && next build`). So migration
> errors show up here, not on your laptop.
>
> **This is the only route** a migration takes to the hosted database. Nobody runs
> migrations against the cloud from a personal machine.

### 5 — Open the real URL

> 🔴 **This is the step everybody skips, and the step that catches real bugs.**

Open `https://wattwiser.vercel.app` and check:

| Check                            | If it's broken, it's usually                                      |
|----------------------------------|-------------------------------------------------------------------|
| Does the page you changed appear | A runtime error — check the Vercel logs                           |
| **Does the data load**           | **A missing environment variable on Vercel** — nearly always this |
| Do the live numbers move         | The data generator isn't running                                  |

A screen that works fine on localhost but is blank in production is **almost
always** a missing environment variable, not a code bug.

#### Check the hosted database

```
https://wattwiser.vercel.app/api/health
```

Returns the list of tables the hosted database **actually has**:

```json
{ "ok": true, "tables": ["appliances", "calibration_sessions", ...] }
```

A missing table means the migration hasn't reached it.

### 6 — Report back

Three lines:
- What went live
- The URL to look at
- Anything you noticed but didn't fix

**Don't say "done" until step 5 has actually been done.**

---

## What you'll see

### When everything's fine

- `just check` is green
- Vercel shows **Ready** with a green tick
- The real URL shows the change
- `/api/health` lists all 9 tables

### Timeline

| Step                  | How long      |
|-----------------------|---------------|
| `just check`          | 30–60 seconds |
| Testing locally       | up to you     |
| `git push`            | a few seconds |
| Vercel build          | 1–3 minutes   |
| Checking the real URL | 1 minute      |

---

## Worth knowing

### ⛔ Never stack new work on a red build

Rule number one. Red build means fix it first, then do anything else.

### ⛔ Never use npm or npx

`npm install` creates a `package-lock.json` — a second lockfile — and **that has
already broken the Vercel build once.**

| Instead of              | Use                  |
|-------------------------|----------------------|
| `npm install`           | `pnpm install`       |
| `npm install <package>` | `pnpm add <package>` |
| `npx <command>`         | `pnpm dlx <command>` |

`.gitignore` already blocks `package-lock.json`, but don't create one in the
first place.

### ⚠️ The hosted database connection string never lives on this machine

It lives **only** in Vercel → Settings → Environment Variables.

`lib/db/target.ts` blocks any outbound connection from a local environment. If
you see:

```
Refusing to connect to a non-local database (...) from a local environment
```

then **fix your `.env.local`, don't touch that guard.** It's doing its job.

### Migrations have exactly one route to the cloud

```
edit lib/db/schema.ts
    ↓
just generate <name>    produces the SQL file
    ↓
just migrate            applies it to the LOCAL database
    ↓
test on localhost
    ↓
commit + push
    ↓
the Vercel build applies it to the HOSTED database
```

---

**Back to the index:** [README.md](./README.md)
