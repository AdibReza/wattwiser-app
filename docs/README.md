# WattWiser documentation

Start at [`../CLAUDE.md`](../CLAUDE.md) for the project brief, locked decisions
and working rules. This page tells you which document answers which question.

## Which file do I need?

| I need to… | Read |
|---|---|
| Understand what this project is and how the two sides fit together | [`product-brief.md`](./product-brief.md) |
| Know whether something is in scope, or why a technology was ruled out | [`scope-and-decisions.md`](./scope-and-decisions.md) |
| Know what to build next, and what "done" means for it | [`build-order.md`](./build-order.md) |
| Build or change a page | [`specs/screens.md`](./specs/screens.md) |
| Add or alter a table, column, or index | [`specs/data-contract.md`](./specs/data-contract.md) |
| Add or change an API route | [`specs/api-routes.md`](./specs/api-routes.md) |
| Generate live-looking power data, or seed the database | [`specs/mock-data.md`](./specs/mock-data.md) |
| Hand the contract to the data side, or prove the link works | [`guides/data-side-handover.md`](./guides/data-side-handover.md) |
| Check a decision against a known trap before committing to it | [`guides/known-pitfalls.md`](./guides/known-pitfalls.md) |

## Layout

```
CLAUDE.md                        agent brief — auto-loaded every session
AGENTS.md                        pointer to CLAUDE.md for non-Claude tools
docs/
  README.md                      this index
  product-brief.md               what it is, the two sides, the boundary
  scope-and-decisions.md         locked decisions, cut list, future roadmap
  build-order.md                 ordered milestones with definitions of done
  specs/
    screens.md                   screen map and per-screen specification
    data-contract.md             database schema and write ownership
    api-routes.md                web API surface and response shapes
    mock-data.md                 mock generator and seed data
  guides/
    data-side-handover.md        what to send the data side, and how to verify
    known-pitfalls.md            three things that are easy to get wrong
  source/
    README.md                    what the originals say, and what superseded it
    refined-flow-and-tasks.md    the original document — domain intent
    website-details.md           the original document — original screens
    milestones.md                the original document — original plan
    images/                      figures from the original screens document
.claude/skills/
  ship-a-change/                 build → test → deploy → verify loop
  new-screen/                    build a page to the screen spec
  db-change/                     change the schema without breaking the contract
```

## Source of truth

These documents are derived from three original team documents, now converted to
Markdown and committed in [`source/`](./source/):

- [`source/refined-flow-and-tasks.md`](./source/refined-flow-and-tasks.md)
- [`source/website-details.md`](./source/website-details.md)
- [`source/milestones.md`](./source/milestones.md)

Section references to them are preserved inline throughout and link straight to
the relevant section, so any claim here can be traced back to its origin.

⚠️ **The source documents predate the locked decisions.** They describe React,
FastAPI, login screens, a Raspberry Pi and a full ML stack — none of which this
MVP builds. Where a source document and [`../CLAUDE.md`](../CLAUDE.md) disagree,
**CLAUDE.md wins.** The full list of what was superseded is in
[`source/README.md`](./source/README.md#superseded-by-the-locked-decisions).
