import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";

const { readings, devices, mockSwitches } = schema;

export type ReadingPoint = { ts: string; watts: number };

export async function latestReading(householdId: string): Promise<ReadingPoint | null> {
  const [row] = await getDb()
    .select({ ts: readings.ts, watts: readings.watts })
    .from(readings)
    .where(eq(readings.householdId, householdId))
    .orderBy(desc(readings.ts))
    .limit(1);
  return row ? { ts: toIso(row.ts)!, watts: Number(row.watts) } : null;
}

/** MVP: the mock generator writes here. The data side owns this table once the real pipeline runs. */
export async function insertReading(householdId: string, ts: Date, watts: number): Promise<void> {
  await getDb().insert(readings).values({ householdId, ts: ts.toISOString(), watts: String(watts) });
}

export async function listReadings(householdId: string, from: Date, to: Date): Promise<ReadingPoint[]> {
  const rows = await getDb()
    .select({ ts: readings.ts, watts: readings.watts })
    .from(readings)
    .where(
      and(
        eq(readings.householdId, householdId),
        gte(readings.ts, from.toISOString()),
        lte(readings.ts, to.toISOString())
      )
    )
    .orderBy(asc(readings.ts));
  return rows.map((r) => ({ ts: toIso(r.ts)!, watts: Number(r.watts) }));
}

/**
 * Energy between two instants, in kWh, by integrating the readings (trapezoid
 * rule on W·s). Gaps longer than 2 minutes contribute nothing, so an idle tab
 * does not invent consumption, while 1-second live rows and 1-minute seeded
 * history both count. Computed in SQL so a day of rows never travels to the app.
 */
export async function energyKwh(householdId: string, from: Date, to: Date): Promise<number> {
  const [row] = await getDb().execute<{ kwh: string | null }>(sql`
    with pts as (
      select ts, watts,
             lag(ts) over (order by ts) as prev_ts,
             lag(watts) over (order by ts) as prev_watts
      from ${readings}
      where ${readings.householdId} = ${householdId}
        and ${readings.ts} >= ${from.toISOString()} and ${readings.ts} <= ${to.toISOString()}
    )
    select coalesce(sum((watts + prev_watts) / 2 * extract(epoch from (ts - prev_ts))) / 3600000, 0) as kwh
    from pts
    where prev_ts is not null and ts - prev_ts <= interval '2 minutes'
  `);
  return Number(row?.kwh ?? 0);
}

/* ---------- device ---------- */

/**
 * The simulated device is now one per household, not one globally. The old fixed
 * uuid is gone: uniqueness comes from the (household_id, device_type) index, so
 * concurrent polls still upsert one row instead of racing to insert two.
 */
const MOCK_DEVICE = { name: "Simulated Shelly (mock)", deviceType: "mock" };
/** A device is Connected if it reported within this window. */
export const DEVICE_STALE_MS = 10_000;

/** Mark the simulated device as just seen. Creates it on first call (insert-or-update, race-safe). */
export async function touchMockDevice(householdId: string, now: Date): Promise<void> {
  const seen = { lastSeenAt: now.toISOString(), status: "connected" };
  await getDb()
    .insert(devices)
    .values({ householdId, ...MOCK_DEVICE, ...seen })
    .onConflictDoUpdate({ target: [devices.householdId, devices.deviceType], set: seen });
}

/** null or stale last_seen_at = Not Connected (docs/specs/api-routes.md). */
export async function isDeviceConnected(householdId: string, now: Date): Promise<boolean> {
  const [row] = await getDb()
    .select({ lastSeenAt: devices.lastSeenAt })
    .from(devices)
    .where(eq(devices.householdId, householdId))
    .orderBy(desc(devices.lastSeenAt))
    .limit(1);
  if (!row?.lastSeenAt) return false;
  return now.getTime() - new Date(row.lastSeenAt).getTime() < DEVICE_STALE_MS;
}

/* ---------- mock switches (the /dev panel) ---------- */

export type MockSwitch = { id: string; label: string; watts: number; isOn: boolean };

/** docs/specs/mock-data.md "Simulated appliances" */
const DEFAULT_SWITCHES: Omit<MockSwitch, "isOn">[] = [
  { id: "kettle", label: "Kettle", watts: 2200 },
  { id: "washing_machine", label: "Washing machine", watts: 2000 },
  { id: "microwave", label: "Microwave", watts: 1200 },
  { id: "air_conditioner", label: "Air conditioner", watts: 1500 },
];

/** Each household gets its own four switches, created the first time it opens /dev. */
export async function getMockSwitches(householdId: string): Promise<MockSwitch[]> {
  const db = getDb();
  const mine = () =>
    db.select().from(mockSwitches).where(eq(mockSwitches.householdId, householdId)).orderBy(asc(mockSwitches.watts));

  let rows = await mine();
  if (rows.length === 0) {
    await db
      .insert(mockSwitches)
      .values(DEFAULT_SWITCHES.map((s) => ({ ...s, householdId, isOn: false })))
      .onConflictDoNothing(); // conflicts on the (household_id, id) primary key
    rows = await mine();
  }
  return rows.map((r) => ({ id: r.id, label: r.label, watts: r.watts, isOn: r.isOn }));
}

export async function setMockSwitch(householdId: string, id: string, isOn: boolean): Promise<MockSwitch | null> {
  const [row] = await getDb()
    .update(mockSwitches)
    .set({ isOn, updatedAt: sql`now()` })
    .where(and(eq(mockSwitches.householdId, householdId), eq(mockSwitches.id, id)))
    .returning();
  return row ? { id: row.id, label: row.label, watts: row.watts, isOn: row.isOn } : null;
}
