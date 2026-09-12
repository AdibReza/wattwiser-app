/**
 * Seed script — docs/specs/mock-data.md "Seed data". Build step 8.
 *
 * Stands in for what the data side will eventually write (readings, events,
 * appliance_signatures) plus the web-side rows a demo needs (household, device,
 * appliances, calibration_sessions, a few event_confirmations).
 *
 *   pnpm db:seed            add the seed (skips if it is already there)
 *   pnpm db:seed --reset    remove the seed, then add it again
 *   pnpm db:seed --clear    remove the seed only
 *
 * Every seeded row is identifiable and removable in one step:
 *   - uuid ids start with 5eed0000-… (household, device, appliances, sessions, signatures, events, confirmations)
 *   - readings are the rows inside the seeded 30-day window (bigserial ids cannot carry a tag)
 * Deterministic: the same numbers every run (seeded random generator).
 * Timestamps: generated in the household's local time (AEST, UTC+10) and STORED IN UTC.
 * Runs against the local Supabase only; lib/db/target.ts refuses anything else.
 */
import { and, gte, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client"; // getDb() is lazy: env is loaded below before the first call

try {
  process.loadEnvFile(".env.local");
} catch {
  /* DATABASE_URL already in the environment */
}

const { household, devices, appliances, calibrationSessions, applianceSignatures, readings, events, eventConfirmations } = schema;

/* ------------------------------------------------------------------ config */

const SEED = "5eed0000";
const DAYS = 30;
const LOCAL_OFFSET_H = 10; // the demo household lives in AEST; habits are described in local hours
const READING_STEP_S = 60; // one reading per minute of history keeps the table at ~43k rows for 30 days
const BASELINE_W = 350;

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset");
const CLEAR = args.has("--clear");

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
const rand = rng(20260912);
const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];

/** Stable uuid from a short label: 5eed0000-0000-4000-8000-<12 hex> */
let counter = 0;
function seedId(kind: string): string {
  const n = (++counter).toString(16).padStart(6, "0");
  const k = [...kind].reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffffff, 7).toString(16).padStart(6, "0");
  return `${SEED}-0000-4000-8000-${k}${n}`;
}

const iso = (d: Date) => d.toISOString();
/** `dayStart` is already the UTC instant of local midnight, so local hour h is simply h hours later. */
function localToUtc(dayStart: Date, hourLocal: number): Date {
  return new Date(dayStart.getTime() + hourLocal * 3600_000);
}

/* ------------------------------------------------------------------ window */

const now = new Date();
// The seeded window ends one hour ago so it never collides with the live mock generator.
const windowEnd = new Date(now.getTime() - 3600_000);
// Start at local midnight, DAYS days back.
const localEnd = new Date(windowEnd.getTime() + LOCAL_OFFSET_H * 3600_000);
const localMidnightEnd = new Date(Date.UTC(localEnd.getUTCFullYear(), localEnd.getUTCMonth(), localEnd.getUTCDate()));
const windowStart = new Date(localMidnightEnd.getTime() - LOCAL_OFFSET_H * 3600_000 - DAYS * 86400_000);

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

const APPLIANCES: ApplianceSeed[] = [
  { id: seedId("kettle"), name: "Kettle", category: "Kitchen", cls: "simple", ratedWatts: 2200, brandModel: "Breville BKE825", calibrated: true, runWatts: 2150 },
  { id: seedId("toaster"), name: "Toaster", category: "Kitchen", cls: "simple", ratedWatts: 900, calibrated: false, runWatts: 880 },
  {
    id: seedId("washer"), name: "Washing machine", category: "Laundry", cls: "multi_stage", ratedWatts: 2000, brandModel: "Bosch Series 6",
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
    id: seedId("dishwasher"), name: "Dishwasher", category: "Kitchen", cls: "multi_stage", ratedWatts: 1800, brandModel: "Miele G 5000",
    commonSettings: "Eco cycle after dinner", calibrated: true, runWatts: 800,
    pattern: [
      { stage: "pre-rinse", watts: 150, seconds: 600 },
      { stage: "heat", watts: 1750, seconds: 900 },
      { stage: "wash", watts: 200, seconds: 2400 },
      { stage: "dry", watts: 1200, seconds: 1200 },
    ],
  },
  { id: seedId("aircon"), name: "Air conditioner", category: "Heating & cooling", cls: "variable_load", ratedWatts: 1500, brandModel: "Daikin 3.5 kW split", commonSettings: "24°C, living room, evenings", calibrated: true, runWatts: 1150 },
  { id: seedId("fridge"), name: "Fridge", category: "Kitchen", cls: "variable_load", ratedWatts: 150, calibrated: false, runWatts: 120 },
];

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
function generateEvents(): EventSeed[] {
  const out: EventSeed[] = [];
  const byName = Object.fromEntries(APPLIANCES.map((a) => [a.name, a]));
  const add = (a: ApplianceSeed | null, start: Date, minutes: number, watts: number, conf: number | null, method: string) => {
    out.push({
      id: seedId("event"),
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
function* generateReadings(evts: EventSeed[]) {
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

async function clearSeed(db: ReturnType<typeof getDb>) {
  const tag = `${SEED}-%`;
  await db.delete(eventConfirmations).where(sql`${eventConfirmations.id}::text like ${tag}`);
  await db.delete(events).where(sql`${events.id}::text like ${tag}`);
  await db.delete(applianceSignatures).where(sql`${applianceSignatures.id}::text like ${tag}`);
  await db.delete(calibrationSessions).where(sql`${calibrationSessions.id}::text like ${tag}`);
  await db.delete(appliances).where(sql`${appliances.id}::text like ${tag}`);
  await db.delete(devices).where(sql`${devices.id}::text like ${tag}`);
  await db.delete(household).where(sql`${household.id}::text like ${tag}`);
  const r = await db.delete(readings).where(and(gte(readings.ts, iso(windowStart)), lt(readings.ts, iso(windowEnd)))).returning({ id: readings.id });
  console.log(`cleared seed rows (readings removed in window: ${r.length})`);
}

async function main() {
  const db = getDb();
  const tag = `${SEED}-%`;

  if (CLEAR || RESET) await clearSeed(db);
  if (CLEAR) return;

  const [already] = await db.select({ id: appliances.id }).from(appliances).where(sql`${appliances.id}::text like ${tag}`).limit(1);
  if (already) {
    console.log("seed already present — run with --reset to replace it");
    return;
  }

  console.log(`seeding ${DAYS} days: ${iso(windowStart)} → ${iso(windowEnd)} (UTC)`);

  // household: only if the user has none (never overwrite real setup)
  const [existingHousehold] = await db.select({ id: household.id }).from(household).limit(1);
  if (existingHousehold) console.log("household: kept the existing row");
  else {
    await db.insert(household).values({
      id: seedId("household"),
      label: "12 Smith St",
      occupants: 3,
      homeType: "house",
      hotWater: "electric",
      heating: "reverse_cycle_ac",
      cooling: "split_ac",
      hasSolar: true,
      hasBattery: false,
      hasEv: false,
      tariffType: "time_of_use",
      tariffConfig: { peakRate: 0.45, offPeakRate: 0.22 },
    });
    console.log("household: 1 row");
  }

  await db.insert(devices).values({
    id: seedId("device"),
    name: "Shelly EM Gen3 - main",
    deviceType: "shelly_em_gen3",
    status: "connected",
    lastSeenAt: iso(now),
  });
  console.log("devices: 1 row");

  await db.insert(appliances).values(
    APPLIANCES.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      applianceClass: a.cls,
      ratedWatts: a.ratedWatts,
      brandModel: a.brandModel ?? null,
      commonSettings: a.commonSettings ?? null,
      notes: "Seeded demo appliance",
    }))
  );
  console.log(`appliances: ${APPLIANCES.length} rows`);

  const evts = generateEvents();

  // calibration sessions: 3 completed runs per calibrated appliance, placed on that appliance's own early runs
  const sessions: (typeof calibrationSessions.$inferInsert)[] = [];
  const signatures: (typeof applianceSignatures.$inferInsert)[] = [];
  for (const a of APPLIANCES.filter((x) => x.calibrated)) {
    const own = evts.filter((e) => e.applianceId === a.id && (e.confidence ?? 0) > 0.5).slice(0, 3);
    for (const e of own) {
      sessions.push({
        id: seedId("session"),
        applianceId: a.id,
        startedAt: iso(new Date(e.startedAt.getTime() - 20_000)),
        endedAt: iso(new Date(e.endedAt.getTime() + 15_000)),
        status: "completed",
        baselineW: String(Math.round(BASELINE_W + between(-30, 30))),
      });
    }
    const durations = own.map((e) => (e.endedAt.getTime() - e.startedAt.getTime()) / 1000);
    signatures.push({
      id: seedId("signature"),
      applianceId: a.id,
      deltaOnW: String(Math.round(a.runWatts * between(0.95, 1.02))),
      deltaOffW: String(-Math.round(a.runWatts * between(0.93, 1.0))),
      durationMinS: Math.round(Math.min(...durations) * 0.9),
      durationMaxS: Math.round(Math.max(...durations) * 1.15),
      pattern: a.pattern ?? null,
      sampleCount: own.length,
      confidence: a.cls === "simple" ? "high" : a.cls === "multi_stage" ? "medium" : "medium",
      updatedAt: iso(now),
    });
  }
  await db.insert(calibrationSessions).values(sessions);
  await db.insert(applianceSignatures).values(signatures);
  console.log(`calibration_sessions: ${sessions.length} rows · appliance_signatures: ${signatures.length} rows`);

  await db.insert(events).values(
    evts.map((e) => ({
      id: e.id,
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
  console.log(`events: ${evts.length} rows (${unknown} unknown, ${low} low-confidence awaiting confirmation)`);

  // a few answered ones from earlier in the month, so the UI has both kinds
  const answered = evts.filter((e) => e.applianceId && (e.confidence ?? 1) < 0.75).slice(0, 3);
  const answers = ["yes", "no", "unknown"] as const;
  await db.insert(eventConfirmations).values(
    answered.map((e, i) => ({
      id: seedId("confirmation"),
      eventId: e.id,
      confirmedApplianceId: answers[i] === "yes" ? e.applianceId : null,
      answer: answers[i],
      createdAt: iso(new Date(e.endedAt.getTime() + 3600_000)),
    }))
  );
  console.log(`event_confirmations: ${answered.length} rows`);

  let n = 0;
  let batch: { ts: string; watts: string }[] = [];
  for (const r of generateReadings(evts)) {
    batch.push(r);
    if (batch.length === 2000) {
      await db.insert(readings).values(batch);
      n += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await db.insert(readings).values(batch);
    n += batch.length;
  }
  console.log(`readings: ${n} rows (one per minute)`);

  const [{ kwh }] = await db.execute<{ kwh: string }>(sql`select coalesce(sum(energy_kwh),0) as kwh from events where id::text like ${tag}`);
  console.log(`events total ${Number(kwh).toFixed(1)} kWh over ${DAYS} days — done`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
