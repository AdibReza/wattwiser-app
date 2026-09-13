/**
 * The 30-day demo dataset — docs/specs/mock-data.md "Seed data".
 *
 * Stands in for what the data side will eventually write (readings, events,
 * appliance_signatures) plus the web-side rows a demo needs (device, appliances,
 * calibration_sessions, a few event_confirmations).
 *
 * Two callers, one implementation:
 *   - lib/mock/seed.ts          the `pnpm db:seed` command line
 *   - app/api/dev/demo-data/    the "Load demo data" button on /dev
 *
 * Demo rows are identifiable so they can be removed without touching anything
 * the household added itself:
 *   - uuid ids begin with 5eed0000-… (device, appliances, sessions, signatures,
 *     events, confirmations). The rest of the uuid is random, so two households
 *     can each hold a full demo set without colliding on a primary key.
 *   - readings carry no tag (bigserial ids cannot), so they are removed by the
 *     window recorded in household.demo_loaded_at.
 *
 * Timestamps are generated in the household's local time (AEST, UTC+10) and
 * STORED IN UTC, like everything else.
 */
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

const { household, devices, appliances, calibrationSessions, applianceSignatures, readings, events, eventConfirmations } = schema;

/* ------------------------------------------------------------------ config */

export const SEED = "5eed0000";
/** Demo rows carry this as the first block of their uuid. */
export const SEED_TAG = `${SEED}-%`;
const DAYS = 30;
const LOCAL_OFFSET_H = 10; // the demo household lives in AEST; habits are described in local hours
const READING_STEP_S = 60; // one reading per minute of history keeps the table at ~43k rows for 30 days
const BASELINE_W = 350;

/* ------------------------------------------------------------------ helpers */

/** Small deterministic random generator (mulberry32) so the seed is identical every run. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/**
 * Everything one run of the generator needs. Deliberately NOT module state:
 * seeding awaits ~25 database round trips while `generateReadings` lazily reads
 * the window on every yield, so a second household starting or clearing its demo
 * mid-run would move the window underneath the first and truncate its data —
 * and stamp it with the wrong timestamp, so removing it later would delete the
 * wrong readings. One object per call, passed explicitly, makes that impossible.
 */
type Run = {
  now: Date;
  windowStart: Date;
  windowEnd: Date;
  rand: () => number;
  between: (lo: number, hi: number) => number;
  pick: <T>(xs: readonly T[]) => T;
};

/**
 * A tagged but unique uuid: 5eed0000-<random>. The tag marks the row as demo
 * data; the random body keeps two households from colliding. (The old version
 * derived the whole uuid from a counter, which was fine when only one household
 * could ever exist and is a primary-key collision now that many can.)
 */
function seedId(): string {
  return `${SEED}${crypto.randomUUID().slice(8)}`;
}

const iso = (d: Date) => d.toISOString();
/** `dayStart` is already the UTC instant of local midnight, so local hour h is simply h hours later. */
function localToUtc(dayStart: Date, hourLocal: number): Date {
  return new Date(dayStart.getTime() + hourLocal * 3600_000);
}

/* ------------------------------------------------------------------ window */

function createRun(at: Date): Run {
  const now = at;
  // The window ends an hour ago so it never collides with the live mock generator.
  const windowEnd = new Date(now.getTime() - 3600_000);
  // Start at local midnight, DAYS days back.
  const localEnd = new Date(windowEnd.getTime() + LOCAL_OFFSET_H * 3600_000);
  const localMidnightEnd = new Date(Date.UTC(localEnd.getUTCFullYear(), localEnd.getUTCMonth(), localEnd.getUTCDate()));
  const windowStart = new Date(localMidnightEnd.getTime() - LOCAL_OFFSET_H * 3600_000 - DAYS * 86400_000);
  // Same numbers every run, so a demo looks the same for everyone.
  const rand = rng(20260912);
  return {
    now,
    windowStart,
    windowEnd,
    rand,
    between: (lo, hi) => lo + rand() * (hi - lo),
    pick: <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)],
  };
}

/* ------------------------------------------------------------------ data */

type Cls = "simple" | "multi_stage" | "variable_load";
type ApplianceSeed = {
  id: string;
  name: string;
  category: string;
  cls: Cls;
  ratedWatts: number;
  brandModel?: string;
  commonSettings?: string;
  calibrated: boolean;
  /** how it shows up in the data */
  runWatts: number;
  pattern?: unknown;
};

/**
 * Built fresh for each household — the ids are random, and a module-level array
 * would hand the same primary keys to every household seeded in this process.
 */
function buildAppliances(): ApplianceSeed[] {
  return [
  { id: seedId(), name: "Kettle", category: "Kitchen", cls: "simple", ratedWatts: 2200, brandModel: "Breville BKE825", calibrated: true, runWatts: 2150 },
  { id: seedId(), name: "Toaster", category: "Kitchen", cls: "simple", ratedWatts: 900, calibrated: false, runWatts: 880 },
  {
    id: seedId(), name: "Washing machine", category: "Laundry", cls: "multi_stage", ratedWatts: 2000, brandModel: "Bosch Series 6",
    commonSettings: "40°C cotton, most Wednesdays and Saturdays", calibrated: true, runWatts: 900,
    pattern: [
      { stage: "fill", watts: 120, seconds: 180 },
      { stage: "heat", watts: 1950, seconds: 540 },
      { stage: "wash", watts: 350, seconds: 1500 },
      { stage: "spin", watts: 600, seconds: 420 },
      { stage: "pump", watts: 200, seconds: 120 },
    ],
  },
  {
    id: seedId(), name: "Dishwasher", category: "Kitchen", cls: "multi_stage", ratedWatts: 1800, brandModel: "Miele G 5000",
    commonSettings: "Eco cycle after dinner", calibrated: true, runWatts: 800,
    pattern: [
      { stage: "pre-rinse", watts: 150, seconds: 600 },
      { stage: "heat", watts: 1750, seconds: 900 },
      { stage: "wash", watts: 200, seconds: 2400 },
      { stage: "dry", watts: 1200, seconds: 1200 },
    ],
  },
  { id: seedId(), name: "Air conditioner", category: "Heating & cooling", cls: "variable_load", ratedWatts: 1500, brandModel: "Daikin 3.5 kW split", commonSettings: "24°C, living room, evenings", calibrated: true, runWatts: 1150 },
  { id: seedId(), name: "Fridge", category: "Kitchen", cls: "variable_load", ratedWatts: 150, calibrated: false, runWatts: 120 },
  ];
}

type EventSeed = {
  id: string;
  applianceId: string | null;
  startedAt: Date;
  endedAt: Date;
  watts: number; // average draw during the run (for readings + energy)
  peakWatts: number;
  deltaOnW: number;
  confidence: number | null;
  method: string;
};

/** 30 days of habits, in local time, stored in UTC. */
function generateEvents(run: Run, list: ApplianceSeed[]): EventSeed[] {
  const { windowStart, windowEnd, rand, between, pick } = run;
  const out: EventSeed[] = [];
  const byName = Object.fromEntries(list.map((a) => [a.name, a]));
  const add = (a: ApplianceSeed | null, start: Date, minutes: number, watts: number, conf: number | null, method: string) => {
    out.push({
      id: seedId(),
      applianceId: a?.id ?? null,
      startedAt: start,
      endedAt: new Date(start.getTime() + minutes * 60_000),
      watts,
      peakWatts: Math.round(watts * between(1.05, 1.3)),
      deltaOnW: Math.round(watts * between(0.9, 1.05)),
      confidence: conf == null ? null : Math.round(conf * 100) / 100,
      method,
    });
  };

  for (let d = 0; d < DAYS; d++) {
    const day = new Date(windowStart.getTime() + LOCAL_OFFSET_H * 3600_000 + d * 86400_000); // local midnight (as UTC-shifted Date)
    const dayStart = new Date(day.getTime() - LOCAL_OFFSET_H * 3600_000); // true UTC instant of local midnight
    const weekday = new Date(day).getUTCDay(); // 0 Sun … 6 Sat, in local terms
    const at = (h: number) => localToUtc(dayStart, h);

    // Kettle: mornings (2–3 boils) + often one in the evening. ~3 min each.
    const boils = 2 + (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < boils; i++) add(byName.Kettle, at(between(6.4, 8.6)), between(2.5, 3.5), byName.Kettle.runWatts, between(0.86, 0.97), "rule_match");
    if (rand() < 0.7) add(byName.Kettle, at(between(19.5, 21.5)), between(2.5, 3.5), byName.Kettle.runWatts, between(0.84, 0.95), "rule_match");

    // Air conditioner: evenings on ~65% of days, 2–4 h.
    if (rand() < 0.65) add(byName["Air conditioner"], at(between(17.8, 19.2)), between(120, 240), byName["Air conditioner"].runWatts, between(0.55, 0.72), "rule_match");

    // Washing machine: Wednesday and Saturday mornings, ~55 min.
    if (weekday === 3 || weekday === 6) add(byName["Washing machine"], at(between(8.5, 10.5)), between(50, 60), byName["Washing machine"].runWatts, between(0.8, 0.92), "rule_match");

    // Dishwasher: about 5 nights a week after dinner, ~85 min.
    if (rand() < 0.72) add(byName.Dishwasher, at(between(20.2, 21.3)), between(80, 90), byName.Dishwasher.runWatts, between(0.6, 0.78), "rule_match");

    // Unknown bucket: 1–3 unexplained runs a day (toaster, fridge compressor, things we never calibrated).
    const unknowns = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < unknowns; i++) add(null, at(between(6, 23)), between(8, 75), Math.round(between(250, 1400)), null, "unmatched");
  }

  // A few LOW-confidence guesses in the last 3 days: these are what /confirm asks about.
  for (let i = 0; i < 5; i++) {
    const dayStart = new Date(windowStart.getTime() + (DAYS - 1 - Math.floor(rand() * 3)) * 86400_000);
    const a = pick([byName["Air conditioner"], byName.Dishwasher, byName["Washing machine"]]);
    add(a, localToUtc(dayStart, between(12, 16)), between(20, 60), Math.round(a.runWatts * between(0.8, 1.1)), between(0.35, 0.5), "rule_match");
  }

  return out.filter((e) => e.endedAt <= windowEnd).sort((x, y) => x.startedAt.getTime() - y.startedAt.getTime());
}

/** One reading per minute across the window: baseline drift + running events + noise. */
function* generateReadings(run: Run, evts: EventSeed[]) {
  const { windowStart, windowEnd, between } = run;
  const stepMs = READING_STEP_S * 1000;
  let i = 0; // events are sorted; keep a moving pointer for speed
  const active: EventSeed[] = [];
  for (let t = windowStart.getTime(); t <= windowEnd.getTime(); t += stepMs) {
    while (i < evts.length && evts[i].startedAt.getTime() <= t) active.push(evts[i++]);
    for (let k = active.length - 1; k >= 0; k--) if (active[k].endedAt.getTime() < t) active.splice(k, 1);
    const drift = 50 * Math.sin((t / 3600_000) * 0.5);
    const load = active.reduce((s, e) => s + e.watts, 0);
    const watts = Math.max(0, Math.round(BASELINE_W + drift + load + between(-20, 20)));
    yield { ts: iso(new Date(t)), watts: String(watts) };
  }
}

/* ------------------------------------------------------------------ run */

export type SeedResult = { appliances: number; events: number; readings: number; kwh: number };

/**
 * Load 30 days of demo data into one household.
 *
 * It never touches the household's own profile row, and never removes anything
 * the household added itself — everything written here carries the seed tag.
 */
export async function seedHousehold(
  householdId: string,
  opts: { now?: Date; log?: (line: string) => void } = {}
): Promise<SeedResult> {
  const db = getDb();
  const log = opts.log ?? (() => {});
  const run = createRun(opts.now ?? new Date());
  const { now, between } = run;

  log(`seeding ${DAYS} days: ${iso(run.windowStart)} → ${iso(run.windowEnd)} (UTC)`);

  // Stamped BEFORE the ~25 writes below, not after. If this run dies partway —
  // it writes tens of thousands of rows against a time limit — the household is
  // still marked as having demo data, so "Remove demo data" can clean up the
  // half-finished mess. Stamping it last would strand those rows with no way out.
  await db
    .update(household)
    .set({ demoLoadedAt: iso(now), updatedAt: sql`now()` })
    .where(eq(household.id, householdId));

  const list = buildAppliances();

  await db.insert(devices).values({
    id: seedId(),
    householdId,
    name: "Shelly EM Gen3 - main",
    deviceType: "shelly_em_gen3",
    status: "connected",
    lastSeenAt: iso(now),
  });

  await db.insert(appliances).values(
    list.map((a) => ({
      id: a.id,
      householdId,
      name: a.name,
      category: a.category,
      applianceClass: a.cls,
      ratedWatts: a.ratedWatts,
      brandModel: a.brandModel ?? null,
      commonSettings: a.commonSettings ?? null,
      notes: "Seeded demo appliance",
    }))
  );
  log(`appliances: ${list.length} rows`);

  const evts = generateEvents(run, list);

  // calibration sessions: 3 completed runs per calibrated appliance, placed on that appliance's own early runs
  const sessions: (typeof calibrationSessions.$inferInsert)[] = [];
  const signatures: (typeof applianceSignatures.$inferInsert)[] = [];
  for (const a of list.filter((x) => x.calibrated)) {
    const own = evts.filter((e) => e.applianceId === a.id && (e.confidence ?? 0) > 0.5).slice(0, 3);
    for (const e of own) {
      sessions.push({
        id: seedId(),
        householdId,
        applianceId: a.id,
        startedAt: iso(new Date(e.startedAt.getTime() - 20_000)),
        endedAt: iso(new Date(e.endedAt.getTime() + 15_000)),
        status: "completed",
        baselineW: String(Math.round(BASELINE_W + between(-30, 30))),
      });
    }
    const durations = own.map((e) => (e.endedAt.getTime() - e.startedAt.getTime()) / 1000);
    signatures.push({
      id: seedId(),
      householdId,
      applianceId: a.id,
      deltaOnW: String(Math.round(a.runWatts * between(0.95, 1.02))),
      deltaOffW: String(-Math.round(a.runWatts * between(0.93, 1.0))),
      durationMinS: Math.round(Math.min(...durations) * 0.9),
      durationMaxS: Math.round(Math.max(...durations) * 1.15),
      pattern: a.pattern ?? null,
      sampleCount: own.length,
      confidence: a.cls === "simple" ? "high" : "medium",
      updatedAt: iso(now),
    });
  }
  if (sessions.length) await db.insert(calibrationSessions).values(sessions);
  if (signatures.length) await db.insert(applianceSignatures).values(signatures);
  log(`calibration_sessions: ${sessions.length} rows · appliance_signatures: ${signatures.length} rows`);

  await db.insert(events).values(
    evts.map((e) => ({
      id: e.id,
      householdId,
      applianceId: e.applianceId,
      startedAt: iso(e.startedAt),
      endedAt: iso(e.endedAt),
      peakWatts: String(e.peakWatts),
      deltaOnW: String(e.deltaOnW),
      energyKwh: String(Math.round((e.watts * (e.endedAt.getTime() - e.startedAt.getTime())) / 3600_000) / 1000),
      confidence: e.confidence == null ? null : String(e.confidence),
      method: e.method,
    }))
  );
  const unknown = evts.filter((e) => e.applianceId === null).length;
  const low = evts.filter((e) => e.confidence != null && e.confidence < 0.5).length;
  log(`events: ${evts.length} rows (${unknown} unknown, ${low} low-confidence awaiting confirmation)`);

  // a few answered ones from earlier in the month, so the UI has both kinds
  const answered = evts.filter((e) => e.applianceId && (e.confidence ?? 1) < 0.75).slice(0, 3);
  const answers = ["yes", "no", "unknown"] as const;
  if (answered.length) {
    await db.insert(eventConfirmations).values(
      answered.map((e, i) => ({
        id: seedId(),
        householdId,
        eventId: e.id,
        confirmedApplianceId: answers[i] === "yes" ? e.applianceId : null,
        answer: answers[i],
        createdAt: iso(new Date(e.endedAt.getTime() + 3600_000)),
      }))
    );
  }

  let readingCount = 0;
  let batch: { householdId: string; ts: string; watts: string }[] = [];
  for (const r of generateReadings(run, evts)) {
    batch.push({ householdId, ...r });
    if (batch.length === 2000) {
      await db.insert(readings).values(batch);
      readingCount += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await db.insert(readings).values(batch);
    readingCount += batch.length;
  }
  log(`readings: ${readingCount} rows (one per minute)`);

  const kwh = evts.reduce((sum, e) => sum + (e.watts * (e.endedAt.getTime() - e.startedAt.getTime())) / 3600_000 / 1000, 0);
  log(`events total ${kwh.toFixed(1)} kWh over ${DAYS} days — done`);

  return { appliances: list.length, events: evts.length, readings: readingCount, kwh: Math.round(kwh * 10) / 10 };
}

/**
 * Remove this household's demo data and nothing else.
 *
 * Everything tagged `5eed0000-` goes. Readings carry no tag, so they are removed
 * by the window that ended at `demo_loaded_at` — which is why that column exists.
 * Anything the household added by hand is untouched.
 */
export async function clearHouseholdDemo(householdId: string): Promise<{ readings: number }> {
  const db = getDb();

  const [row] = await db
    .select({ demoLoadedAt: household.demoLoadedAt })
    .from(household)
    .where(eq(household.id, householdId))
    .limit(1);

  // Confirmations answered in the UI get a plain uuid, not the seed tag, so they
  // must also be removed by the event they point at — event_confirmations.event_id
  // has no ON DELETE CASCADE.
  await db
    .delete(eventConfirmations)
    .where(
      and(
        eq(eventConfirmations.householdId, householdId),
        sql`(${eventConfirmations.id}::text like ${SEED_TAG}
             or ${eventConfirmations.eventId} in (select id from ${events} where id::text like ${SEED_TAG}))`
      )
    );

  for (const table of [events, applianceSignatures, calibrationSessions, appliances, devices] as const) {
    await db.delete(table).where(and(eq(table.householdId, householdId), sql`${table.id}::text like ${SEED_TAG}`));
  }

  let removed = 0;
  if (row?.demoLoadedAt) {
    // Rebuild the exact window this household's demo was written into, from the
    // timestamp recorded then — never from the clock now.
    const { windowStart, windowEnd } = createRun(new Date(row.demoLoadedAt));
    const gone = await db
      .delete(readings)
      .where(
        and(
          eq(readings.householdId, householdId),
          gte(readings.ts, iso(windowStart)),
          lt(readings.ts, iso(windowEnd))
        )
      )
      .returning({ id: readings.id });
    removed = gone.length;
  }

  await db.update(household).set({ demoLoadedAt: null, updatedAt: sql`now()` }).where(eq(household.id, householdId));
  return { readings: removed };
}
