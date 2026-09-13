8️⃣  PUT A CHANGE LIVE
════════════════════════════════════════

Where: a terminal + the Vercel dashboard + the real URL

🔧 NOT FOR NORMAL USERS.
   For whoever builds the project.

⚠️ THIS PAGE IS DIFFERENT FROM THE OTHER SEVEN.
   Those cover USING the app and have no commands.
   This one covers putting the app on the internet,
   which means typing commands.
   The glossary below translates every term.


📖  WORDS YOU'LL MEET HERE

   • Deploy
     Put a new version from your machine onto the
     internet so others can see it

   • Build
     The machine packaging the whole app into
     something runnable.
     GREEN build = packaged fine
     RED build = broken, can't go live

   • Vercel
     The company renting you space on the internet.
     Your app lives there

   • Terminal
     The black window where you type commands

   • Commit
     Marking a point in your changes, with a note
     saying what you changed

   • Push
     Sending those marks up to the shared store

   • GitHub
     That shared store. Anything pushed there makes
     Vercel repackage automatically

   • localhost
     The test copy on your own machine.
     Only you can see it

   • The real URL
     The public address anyone can open:
     wattwiser.vercel.app


   🎯 THE WHOLE PROCESS IN ONE SENTENCE

      Type a few commands locally to be sure nothing's
      broken → push to the shared store → wait while it
      repackages → open the real address and look at it
      with your own eyes.


⭐  WHY THERE'S A FIXED PROCESS

   🚫 THE PROJECT'S MOST IMPORTANT RULE:
      NEVER STACK NEW WORK ON A RED BUILD.

   If you write feature B while feature A is breaking
   the build, then when it goes red you don't know
   whether A or B caused it.
   Fixing one bug becomes untangling a knot.

   🚨 And there's one step EVERYBODY SKIPS —
      step 5, opening the real URL.

      A green build only means the code COMPILES.
      It does not mean the page WORKS.


📋  BEFORE YOU START

   • A change that's finished and tested locally
   • Docker Desktop running
   • "just up" already run
   • Signed in to git with the right account

   💡 This project uses the GitHub account
      hoaiphongdev, configured per project.
      Don't use the "gh" command here.


━━━ STEP 1 — Build on your machine ━━━━━━━━━━━━━━━━━━

      pnpm build

   Or run the whole check suite:

      just check

   "just check" runs THREE things — exactly what
   Vercel will run:

      • pnpm build
        Does the code compile

      • pnpm exec eslint .
        Any code style problems

      • pnpm check:maths
        Is the electricity pricing arithmetic right

   ✅ GREEN: ends with a list of routes, nothing red
   ❌ RED: STOP HERE. Fix it locally.
          Don't push a build that's already broken —
          you'd only wait 5 more minutes for Vercel
          to tell you the same thing.

   💡 Use "pnpm build", not "pnpm dev". The development
      server tolerates plenty of things Vercel rejects.


━━━ STEP 2 — Test on localhost ━━━━━━━━━━━━━━━━━━━━━━

      just up        # local database, if not running
      just migrate   # if the change includes one
      just run

   • Open the page you changed
   • Check the thing you changed ACTUALLY WORKS
   • Check the TWO NEAREST SCREENS for breakage

   For anything with live numbers — dashboard,
   teaching guide — confirm the NUMBERS ARE MOVING.
   Frozen numbers mean the data generator isn't running.


━━━ STEP 3 — Commit and push ━━━━━━━━━━━━━━━━━━━━━━━━

   One change, one commit.

      git add -A
      git commit -m "✨ feat: add the confirmation screen"
      git push


   ⚠️ THE COMMIT FORMAT IS MANDATORY

      <emoji> <type>: <message>

   The types and their emoji:

      ✨  feat      A new feature
      🐛  fix       A bug fix
      📝  docs      Documentation
      🎨  style     Appearance, formatting
      ♻️  refactor  Tidying without changing behaviour
      ✅  test      Tests
      🔧  chore     Odd jobs, configuration
      🚀  deploy    Deployment
      🗃️  db        Database

   The message part: imperative, lowercase,
   no full stop.

      ✅ RIGHT
         ✨ feat: add household setup form
         🐛 fix: correct peak window boundary
         🎨 style: pin the sidebar

      ❌ WRONG
         Added household setup form.
         fix: Fixed the bug
         update


━━━ STEP 4 — Wait for a green Vercel build ━━━━━━━━━━

   Open the Vercel dashboard. Wait for the deployment
   to finish.

   ✅ GREEN: carry on
   ❌ RED: open the build log and read the FIRST error,
          not the last. Everything after the first
          error is usually noise.
          DON'T START ANYTHING NEW UNTIL IT'S GREEN.

   💡 The Vercel build ALSO runs database migrations
      against the hosted database. So migration errors
      show up here, not on your laptop.

      This is the ONLY route a migration takes to the
      hosted database. Nobody runs migrations against
      the cloud from a personal machine.


━━━ STEP 5 — Open the real URL ━━━━━━━━━━━━━━━━━━━━━━

   🚨 THIS IS THE STEP EVERYBODY SKIPS, AND THE STEP
      THAT CATCHES REAL BUGS.

   Open https://wattwiser.vercel.app and check:

      • Does the page you changed appear?
        If not → a runtime error, check the Vercel logs

      • DOES THE DATA LOAD?
        If not → a missing environment variable
        on Vercel. Nearly always this.

      • Do the live numbers move?
        If not → the data generator isn't running

   🚨 A screen that works on localhost but is blank in
      production is ALMOST ALWAYS a missing environment
      variable, not a code bug.


   Check the hosted database:

      https://wattwiser.vercel.app/api/health

   Returns the list of tables the hosted database
   actually has:

      { "ok": true, "tables": ["appliances", ...] }

   A missing table means the migration hasn't
   reached it.


━━━ STEP 6 — Report back ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Three lines:

      • What went live
      • The URL to look at
      • Anything you noticed but didn't fix

   🚨 Don't say "done" until step 5 has actually
      been done.


✅  WHEN EVERYTHING'S FINE

   • "just check" is green
   • Vercel shows "Ready" with a green tick
   • The real URL shows the change
   • /api/health lists all 9 tables


⏱️  TIMELINE

      just check ............... 30–60 seconds
      Testing locally .......... up to you
      git push ................. a few seconds
      Vercel build ............. 1–3 minutes
      Checking the real URL .... 1 minute


🚫  NEVER USE npm OR npx

   "npm install" creates a package-lock.json — a second
   lockfile — and THAT HAS ALREADY BROKEN THE VERCEL
   BUILD ONCE.

      npm install          →  use  pnpm install
      npm install <pkg>    →  use  pnpm add <pkg>
      npx <command>        →  use  pnpm dlx <command>

   .gitignore already blocks package-lock.json,
   but don't create one in the first place.


🔒  THE HOSTED DATABASE PASSWORD NEVER LIVES ON THIS MACHINE

   It lives ONLY in Vercel → Settings →
   Environment Variables.

   There's a guard that blocks any outbound connection
   from a local environment. If you see:

      Refusing to connect to a non-local database
      (...) from a local environment

   ➜ Fix your .env.local. DON'T touch that guard.
     It's doing its job.


🛤️  MIGRATIONS HAVE EXACTLY ONE ROUTE TO THE CLOUD

      edit the schema file
           ↓
      just generate <name>    produces the SQL file
           ↓
      just migrate            applies it LOCALLY
           ↓
      test on localhost
           ↓
      commit + push
           ↓
      the Vercel build applies it to the HOSTED database


⬅️  BACK TO THE INDEX

   README.md
