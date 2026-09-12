---
name: design-review
description: Check a finished screen against the WattWiser design system before it ships. Use after building or changing any page, when the user asks whether a screen looks right, or when something looks off. Catches raw colours, missing states, duplicate primary actions, and wrong status words.
---

# Design review

Run this on every screen before `ship-a-change`. The bar is in
`docs/design-system.md`: **simple and modern, ugly is not acceptable.**

## 1. Mechanical checks (run them, do not eyeball)

```bash
# raw colours outside the token file — must print nothing
grep -rnE "(bg|text|border)-(blue|green|amber|orange|red|zinc|gray|slate|neutral)-[0-9]{2,3}|#[0-9a-fA-F]{6}" app components --include="*.tsx" | grep -v "components/ui/"

# numbers formatted by hand — must print nothing outside lib/format.ts
grep -rn "toFixed\|toLocaleString" app components --include="*.tsx" | grep -v "components/ui/"

# status words typed inline instead of StatusBadge — must print nothing
grep -rnE "\"(Not Calibrated|Calibrated|Connected|Not Connected|Discarded|Recording)\"" app --include="*.tsx"

# hand-edited shadcn files — must print nothing
git diff --name-only HEAD -- components/ui/
```

Any output is a finding. Fix it before continuing.

## 2. Screen anatomy checklist

Open the screen on localhost and answer each one. A "no" is a finding.

- [ ] Lives under `app/(app)/` and shows the sidebar shell.
- [ ] Starts with `PageHeader`. There is **exactly one** primary (blue) button on the screen, or none.
- [ ] Headline numbers are `StatCard`s; the live power number is the only green number.
- [ ] Every status is a `StatusBadge` from the fixed vocabulary.
- [ ] Loading shows `Skeleton` in the shape of the content. Empty shows `EmptyState` with a next step. Error shows a destructive `Alert` with a plain sentence.
- [ ] Saving shows a toast and then navigates.
- [ ] Timestamps display in local time via `lib/format.ts`, from UTC.
- [ ] Copy is plain words, sentence case. No jargon. No estimate presented as a measurement.
- [ ] Confidence reads High / Medium / Low. `/breakdown` shows the Unknown row.
- [ ] At 375px wide nothing overflows and the menu button opens the drawer.
- [ ] Icon-only buttons have `aria-label`.

## 3. Report

Two lines: what passed, and each finding with the file and the fix. If there
are no findings, say so and hand over to `ship-a-change`.
