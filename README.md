# WattWiser

**NILM (Non-Intrusive Load Monitoring).** One Shelly EM Gen3 with a CT clamp measures
whole-house electricity; the system works backwards to identify individual
appliances, so a household can see where the bill goes.

## The problem

A household gets one electricity bill and no idea what drove it. Metering every
appliance individually means an electrician, a smart plug per socket, and a cost
nobody will pay.

WattWiser solves it with **one sensor** at the meter.

## How it works

The sensor reports a single number — whole-house power, roughly once a second.
Working backwards from that needs two things the sensor cannot supply:

1. **What the household owns** — declared once, in the setup form and the appliance inventory
2. **What each appliance looks like in the data** — learned through guided calibration

That is why **the input UI is the primary goal**, not the dashboard. The
dashboard is what the input UI makes possible.

## Architecture

Two sides that never call each other. They meet only at a shared PostgreSQL
database (Supabase).

| Side | Stack | Owns |
|---|---|---|
| **Web** | Next.js on Vercel | every screen, every API route, the database schema |
| **Data** | separate Python service | MQTT subscriber, edge detection, event pairing, signature building |

The data side's output (`readings`, `events`, `appliance_signatures`) is **mocked
by the web side**, so every screen works end to end before the pipeline exists.

## Running locally

Works on **macOS** and **Windows**. Use **Terminal** on macOS and **PowerShell**
on Windows — every command below is the same on both unless a table says
otherwise.

### 1. Install the tools (once per machine)

| Tool | macOS | Windows |
|---|---|---|
| **Git** | `xcode-select --install` | [git-scm.com](https://git-scm.com/download/win) (also gives you Git Bash) |
| **Docker Desktop** — runs the local database | [docker.com](https://www.docker.com/products/docker-desktop/) | [docker.com](https://www.docker.com/products/docker-desktop/) — accept the **WSL 2** option when the installer asks |
| **Node.js 22** | [nodejs.org](https://nodejs.org/) (22.x LTS) or `mise install` | [nodejs.org](https://nodejs.org/) (22.x LTS) |
| **pnpm** — the package manager | `corepack enable` | `corepack enable` in PowerShell opened **as Administrator** |
| **Supabase CLI** — starts the local database | `brew install supabase/tap/supabase` | [Scoop](https://scoop.sh), then `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` and `scoop install supabase` |

#### Windows only: turn on virtualization and WSL 2 first

Docker Desktop on Windows runs the database inside **WSL 2** (a small Linux
built into Windows), which needs **hardware virtualization** switched on. Do
this **before** installing Docker Desktop.

1. **Check virtualization.** Press `Ctrl + Shift + Esc` → **Performance** tab →
   **CPU**. Bottom right, **Virtualization** must say **Enabled**.
2. **If it says Disabled**, turn it on in the BIOS/UEFI (the settings screen
   before Windows starts): Settings → System → Recovery → **Advanced startup →
   Restart now** → Troubleshoot → Advanced options → **UEFI Firmware Settings**
   → Restart. Find the option — usually under *Advanced*, *CPU Configuration* or
   *Security* — named **Intel Virtualization Technology (VT-x)**, **Intel VT-d**
   or **SVM Mode** (AMD). Set it to **Enabled**, save (usually `F10`), restart.
   Check step 1 again.
3. **Install WSL 2.** Open PowerShell **as Administrator** (Start → type
   *PowerShell* → right-click → *Run as administrator*) and run:

   ```powershell
   wsl --install
   ```

   Restart Windows when it finishes. If WSL was already installed, run
   `wsl --update` instead.
4. **Check it.** In a normal PowerShell:

   ```powershell
   wsl --status
   ```

   It should say **Default Version: 2**. If it says 1, run
   `wsl --set-default-version 2`.
5. **Install Docker Desktop**, keep **Use WSL 2 instead of Hyper-V** ticked,
   restart when asked, then open Docker Desktop once and wait for **Engine
   running** at the bottom left.

| You see | Fix |
|---|---|
| `Virtualization support not detected` / `WSL 2 requires an update` | Step 2 (BIOS) was not saved, or run `wsl --update`. |
| `wsl --install` prints only help text | WSL is already there: run `wsl --update`, then `wsl --set-default-version 2`. |
| Docker Desktop stuck on *Engine starting* | Quit Docker Desktop, run `wsl --shutdown` in PowerShell, open Docker Desktop again. |

`corepack enable` gives you the exact pnpm version pinned in `package.json`
(10.26.2). Close and reopen the terminal afterwards, then check:

```bash
node -v        # v22.x
pnpm -v        # 10.26.2
supabase -v    # any 2.x
docker -v      # any version
```

> **pnpm only.** Never run `npm install` in this project: it writes a second
> lockfile and breaks the Vercel build.

### 2. Get the code and install packages

```bash
git clone https://github.com/hoaiphongdev/wattwiser.git
cd wattwiser
pnpm install
```

### 3. Start the local Supabase

Open **Docker Desktop** and wait until it says it is running. Then:

```bash
supabase start
```

The first run downloads the database images and takes a few minutes. Success
ends with a list of local addresses; the two that matter are the database on
port **55322** (`postgresql://postgres:postgres@127.0.0.1:55322/postgres`) and
Studio on port **55323**. An error mentioning Docker means Docker Desktop is not
running yet.

This local Supabase is only **Postgres + Studio** (a web page to browse the
tables, at http://127.0.0.1:55323). Supabase's own auth, storage and realtime
are switched off in `supabase/config.toml` — the app handles sign-in itself.
`supabase stop` shuts it down; your data is kept until the next `supabase start`.

### 4. Create `.env.local`

```bash
cp .env.example .env.local
```

(`cp` works in PowerShell too.) `.env.local` holds this machine's settings and
is never committed. It needs three values:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:55322/postgres` | Already correct in the template. Must point at `127.0.0.1` — the app refuses any other database from a laptop (`lib/db/target.ts`). |
| `BETTER_AUTH_SECRET` | a random 32-byte string | Signs the sign-in cookie. Generate one with the command below and paste it in. |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Already correct in the template. |

Generate the secret (same command on macOS and Windows):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**No Supabase API keys are needed.** The app talks to Postgres directly;
ignore the `anon key` / `service_role key` lines that `supabase start` prints.

### 5. Create the tables and load demo data

```bash
pnpm db:migrate    # create the tables
pnpm db:seed       # optional: 30 days of demo readings
```

### 6. Run the app

```bash
pnpm dev
```

Open http://localhost:3000 and **sign up** with any email and a password of 8+
characters (no email is sent). The first account on a fresh database takes over
the demo household from step 5.

### Everyday commands

| Command | `just` shortcut | What it does |
|---|---|---|
| `supabase start` / `supabase stop` | `just up` / `just down` | Start / stop the local database |
| `pnpm dev` | `just run` | Run the app on http://localhost:3000 |
| `pnpm db:migrate` | `just migrate` | Apply new database changes |
| `pnpm db:seed --reset` | `just seed-reset` | Reload the demo data |
| `supabase db reset` then `pnpm db:migrate` | `just db-reset` | Wipe the local database and rebuild it |
| `pnpm build`, `pnpm exec eslint .`, `pnpm check:maths` | `just check` | The same checks Vercel runs |

[`just`](https://just.systems) is an optional shortcut tool (`brew install just`
/ `scoop install just`); run `just` to list every shortcut. On Windows run the
shortcuts from **Git Bash** — the recipes use shell commands PowerShell does not
have. The left column works everywhere.

### When something goes wrong

| You see | Cause and fix |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop is not running. Open it, wait, run `supabase start` again. |
| `supabase start` fails with a port or `bind` error on Windows | Windows has reserved that port range. In PowerShell **as Administrator**: `net stop winnat` then `net start winnat`, and try again. |
| `Refusing to connect to a non-local database` | `DATABASE_URL` in `.env.local` does not point at `127.0.0.1`. Copy it again from `.env.example`. |
| `DATABASE_URL is not set` | `.env.local` is missing. Do step 4. |
| `pnpm` is not recognized | Run `corepack enable` (as Administrator on Windows), then reopen the terminal. |
| Sign-up or sign-in fails | `BETTER_AUTH_SECRET` is still the placeholder. Generate one (step 4) and restart `pnpm dev`. |
| `relation "…" does not exist` | The tables are missing. Run `pnpm db:migrate`. |

## Two databases, one rule

Local code only ever talks to the local database. The hosted connection string
lives **only** in Vercel's environment variables, never in a file on your
machine — `lib/db/target.ts` enforces this. Migrations reach the hosted database
only through the Vercel build (`vercel-build`).

Vercel → Settings → Environment Variables:

| Variable | Value on Vercel |
|---|---|
| `DATABASE_URL` | Hosted Supabase **Transaction pooler** string (port 6543), from Supabase → Connect. Scope it to **Production** only. |
| `BETTER_AUTH_SECRET` | A **different** random value from your local one. Without it the build still passes but nobody can sign in. |
| `BETTER_AUTH_URL` | **Leave unset** — pinning it breaks sign-in on preview URLs. |

## Shipping a change

```bash
pnpm build              # the same checks Vercel runs (or: just check)
pnpm exec eslint .
pnpm check:maths
git commit -m "<emoji> <type>: <message>"
git push
```

Then confirm the Vercel build is green and **open the live URL**. A green build
means the code compiled, not that the page works.

**Never stack new work on a red build.**

## Documentation

| I need to… | Read |
|---|---|
| Understand the project and its locked decisions | [`CLAUDE.md`](./CLAUDE.md) |
| Find the spec for a task | [`docs/README.md`](./docs/README.md) |
| Build or change a page | [`docs/specs/screens.md`](./docs/specs/screens.md) |
| Add or alter a table | [`docs/specs/data-contract.md`](./docs/specs/data-contract.md) |
| Add or change an API route | [`docs/specs/api-routes.md`](./docs/specs/api-routes.md) |

## Stack

Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL
(Supabase) · Vercel · pnpm
