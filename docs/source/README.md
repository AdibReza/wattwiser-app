# Original team documents

The three documents everything in `docs/` is derived from, converted to Markdown
so agents can read them.

| Markdown | Contains |
|---|---|
| [`refined-flow-and-tasks.md`](./refined-flow-and-tasks.md) | The fullest account of the domain: NILM approach, the three appliance classes, calibration methodology, event detection, disaggregation output, dashboard content |
| [`website-details.md`](./website-details.md) | Original screen-by-screen walkthrough, the 5-step calibration flow, the first API list, and two architecture figures |
| [`milestones.md`](./milestones.md) | Delivery plan before and after the Shelly is installed, original table list, fake-data generator plan |

The Markdown is a **verbatim** conversion of the originals — only formatting
changed (headings, lists, tables, spacing). Text coverage was verified at 100%
against the raw source.

**Do not edit these files to reflect new decisions.** They are a historical
record. New decisions go in [`../../CLAUDE.md`](../../CLAUDE.md) and the specs.

## Superseded by the locked decisions

These documents were written **before** the current scope was set. They describe
a different stack and a wider scope than this MVP builds.

**Where a source document and [`../../CLAUDE.md`](../../CLAUDE.md) disagree,
CLAUDE.md wins.** Read the sources for *requirements and domain intent* — what
an appliance signature is, why rated wattage can't identify an appliance, what
the calibration wizard has to accomplish. Do not read them for stack or scope.

| Topic | The source documents say | This MVP does |
|---|---|---|
| Frontend | React ([`milestones.md` §1](./milestones.md#1-website--backend-skeleton)) | **Next.js** |
| Backend | Python + FastAPI + SQLAlchemy ([`milestones.md` §1–2](./milestones.md#1-website--backend-skeleton)) | **Next.js route handlers.** No Python on the web side |
| Authentication | Login / Register, JWT in the browser ([`website-details.md` §1](./website-details.md#1-login--register)) | **None.** Single household, no login screens |
| `Users` table | Listed in [`milestones.md` §2](./milestones.md#2-database) | Replaced by a single **`household`** row |
| Local collector | Raspberry Pi bridge device ([`refined-flow-and-tasks.md`](./refined-flow-and-tasks.md#2-what-each-step-means), diagram §2) | **Cut.** Shelly reaches the backend over the internet |
| MQTT broker | Self-hosted Mosquitto ([`milestones.md` §6](./milestones.md#6-mosquitto--python-mqtt-working)) | **Cut from this MVP** |
| Machine learning | K-Means, DBSCAN, Random Forest, Seq2Point, Seq2Seq, HMM/FHMM, CNN/RNN, transfer learning ([`refined-flow-and-tasks.md` §9](./refined-flow-and-tasks.md#9-existing-nilm-models), [`milestones.md` §3–4](./milestones.md#3-appliance-calibration--first-ml-model)) | **Cut.** Rule-based edge detection plus threshold matching |
| Fake data | Python generator publishing through the backend ([`milestones.md` §4](./milestones.md#4-fake-electricity-data)) | Web-side mock generator plus a seed script |
| Team split | One backend person, one frontend person ([`milestones.md` §1](./milestones.md#1-website--backend-skeleton)) | **Web side / data side**, meeting only at the database |
| Hosting | Unspecified | **Vercel** + **Supabase** |

PostgreSQL survives unchanged — Supabase is PostgreSQL.

## One inconsistency inside the sources

[`refined-flow-and-tasks.md` §1](./refined-flow-and-tasks.md#1-household-setup)
says a laptop does *not* need to stay in the house and the Shelly should reach
the backend directly over the internet. The flow diagram later in the same
document inserts a **Raspberry Pi / Local Collector** between the Shelly and the
cloud.

This MVP follows §1: **no local collector.** Noted here so nobody has to
rediscover the contradiction.
