---
name: ship-a-change
description: Take a finished change from localhost to a verified live Vercel URL. Use whenever a feature, fix, or screen is ready to go live, or when the user says ship it, deploy, push it, or asks whether the build is green. Enforces the never-stack-on-a-red-build rule.
---

# Ship a change

Every feature follows this loop. **Never start new work on a red build.**

The person you are helping has never written code. Narrate each step in plain
language and tell them what a good result looks like before you run it.

## 1. Build locally

Run the production build, not just the dev server — the dev server tolerates
errors Vercel will reject.

```bash
pnpm build
```

**Green:** ends with a route list and no red text.
**Red:** stop here. Fix it locally. Do not push a build that fails on your own
machine — you will only wait five minutes to be told the same thing.

## 2. Test on localhost

```bash
pnpm dev
```

Open the page that changed and check the thing that changed actually works. Then
check you did not break the two screens nearest it.

For anything with live numbers — the dashboard, the calibration wizard — confirm
the numbers **move**. A static number means the mock generator is not running.
See `docs/specs/mock-data.md`.

## 3. Commit and push

One change, one commit. A message that says what changed, not "update".

```bash
git add -A
git commit -m "<what changed>"
git push
```

## 4. Confirm the Vercel build is green

Wait for the deployment to finish and check its status.

**Green:** continue.
**Red:** open the build log, read the first error — not the last, the first — and
fix it. Everything after the first error is usually noise. Do not start anything
new until this is green.

## 5. Check the live URL

**This is the step people skip, and it is the one that catches real problems.**
A green build only means the code compiled. It does not mean the page works.

Open the live URL and check:

- The page that changed renders.
- Data loads — a screen that works on localhost and is empty in production is
  almost always a missing environment variable in Vercel, not a code bug.
- Live numbers move.

## 6. Report back

Tell the user, in one or two lines:

- what is now live,
- the URL to look at,
- anything you noticed but did not fix.

If a step failed, say which one and what the error was. Do not report a change as
shipped until step 5 has actually been done.

## Reference

- Build order and what "done" means per step: `docs/build-order.md`
- Working rules: `CLAUDE.md`
