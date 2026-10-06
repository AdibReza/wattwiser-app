
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";

const { readings, devices, mockSwitches } = schema;

const REAL_DEVICE_TYPE = "shelly_em_gen3";

export type ReadingPoint = {
  ts: string;
  watts: number;
};

/* ---------- real Shelly readings ---------- */

/**
 * Return the latest reading linked to a real Shelly EM Gen3.
 * Unlinked and simulated readings are excluded.
 */
export async function latestReading(
  householdId: string
): Promise<ReadingPoint | null> {
  const [row] = await getDb()
    .select({
      ts: readings.ts,
      watts: readings.watts,
    })
    .from(readings)
    .innerJoin(devices, eq(readings.deviceId, devices.id))
    .where(
      and(
        eq(readings.householdId, householdId),
        eq(devices.deviceType, REAL_DEVICE_TYPE)
      )
    )
    .orderBy(desc(readings.ts))
    .limit(1);

  return row
    ? { ts: toIso(row.ts)!, watts: Number(row.watts) }
    : null;
}

/**
 * Legacy mock-data helper. Retained for compatibility.
 * Do not use it to populate the real Shelly dashboard.
 */
export async function insertReading(
  householdId: string,
  ts: Date,
  watts: number
): Promise<void> {
  await getDb()
    .insert(readings)
    .values({
      householdId,
      ts: ts.toISOString(),
      watts: String(watts),
    });
}

/** Return real Shelly EM Gen3 readings for the chart. */
export async function listReadings(
  householdId: string,
  from: Date,
  to: Date
): Promise<ReadingPoint[]> {
  const rows = await getDb()
    .select({
      ts: readings.ts,
      watts: readings.watts,
    })
    .from(readings)
    .innerJoin(devices, eq(readings.deviceId, devices.id))
    .where(
      and(
        eq(readings.householdId, householdId),
        eq(devices.deviceType, REAL_DEVICE_TYPE),
        gte(readings.ts, from.toISOString()),
        lte(readings.ts, to.toISOString())
      )
    )
    .orderBy(asc(readings.ts));

  return rows.map((row) => ({
    ts: toIso(row.ts)!,
    watts: Number(row.watts),
  }));
}

/**
 * Calculate energy from real Shelly readings using trapezoidal integration.
 * Gaps greater than two minutes contribute nothing.
 */
export async function energyKwh(
  householdId: string,
  from: Date,
  to: Date
): Promise<number> {
  const [row] = await getDb().execute<{ kwh: string | null }>(sql`
    WITH pts AS (
      SELECT
        r.ts,
        r.watts,
        LAG(r.ts) OVER (ORDER BY r.ts) AS prev_ts,
        LAG(r.watts) OVER (ORDER BY r.ts) AS prev_watts
      FROM ${readings} AS r
      INNER JOIN ${devices} AS d ON r.device_id = d.id
      WHERE r.household_id = ${householdId}
        AND d.device_type = ${REAL_DEVICE_TYPE}
        AND r.ts >= ${from.toISOString()}
        AND r.ts <= ${to.toISOString()}
    )
    SELECT COALESCE(
      SUM(
        (watts + prev_watts) / 2
        * EXTRACT(EPOCH FROM (ts - prev_ts))
      ) / 3600000,
      0
    ) AS kwh
    FROM pts
    WHERE prev_ts IS NOT NULL
      AND ts - prev_ts <= INTERVAL '2 minutes'
  `);

  return Number(row?.kwh ?? 0);
}

/* ---------- device connection ---------- */

/**
 * Allow up to 45 seconds without a new reading before marking the
 * device stale. This accommodates the approximately 15-second intervals
 * observed so far. Adjust this if the collector's actual interval differs.
 */
export const DEVICE_STALE_MS = 45_000;

/**
 * Treat the Shelly as connected when its latest real measurement is recent.
 * This avoids relying on lastSeenAt if the collector does not update it.
 */
export async function isDeviceConnected(
  householdId: string,
  now: Date
): Promise<boolean> {
  const [row] = await getDb()
    .select({
      ts: readings.ts,
    })
    .from(readings)
    .innerJoin(devices, eq(readings.deviceId, devices.id))
    .where(
      and(
        eq(readings.householdId, householdId),
        eq(devices.deviceType, REAL_DEVICE_TYPE)
      )
    )
    .orderBy(desc(readings.ts))
    .limit(1);

  if (!row?.ts) return false;

  const ageMs = now.getTime() - new Date(row.ts).getTime();

  return ageMs >= 0 && ageMs < DEVICE_STALE_MS;
}

/* ---------- mock switches: development tools only ---------- */

export type MockSwitch = {
  id: string;
  label: string;
  watts: number;
  isOn: boolean;
};

const DEFAULT_SWITCHES: Omit<MockSwitch, "isOn">[] = [
  { id: "kettle", label: "Kettle", watts: 2200 },
  { id: "washing_machine", label: "Washing machine", watts: 2000 },
  { id: "microwave", label: "Microwave", watts: 1200 },
  { id: "air_conditioner", label: "Air conditioner", watts: 1500 },
];

/** Development-only simulated appliance switches. */
export async function getMockSwitches(
  householdId: string
): Promise<MockSwitch[]> {
  const db = getDb();

  const mine = () =>
    db
      .select()
      .from(mockSwitches)
      .where(eq(mockSwitches.householdId, householdId))
      .orderBy(asc(mockSwitches.watts));

  let rows = await mine();

  if (rows.length === 0) {
    await db
      .insert(mockSwitches)
      .values(
        DEFAULT_SWITCHES.map((item) => ({
          ...item,
          householdId,
          isOn: false,
        }))
      )
      .onConflictDoNothing();

    rows = await mine();
  }

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    watts: row.watts,
    isOn: row.isOn,
  }));
}

export async function setMockSwitch(
  householdId: string,
  id: string,
  isOn: boolean
): Promise<MockSwitch | null> {
  const [row] = await getDb()
    .update(mockSwitches)
    .set({
      isOn,
      updatedAt: sql`now()`,
    })
    .where(
      and(
        eq(mockSwitches.householdId, householdId),
        eq(mockSwitches.id, id)
      )
    )
    .returning();

  return row
    ? {
        id: row.id,
        label: row.label,
        watts: row.watts,
        isOn: row.isOn,
      }
    : null;
}

/** Legacy mock helper retained for compatibility; not for the real dashboard. */
const MOCK_DEVICE = {
  name: "Simulated Shelly (mock)",
  deviceType: "mock",
};

export async function touchMockDevice(
  householdId: string,
  now: Date
): Promise<void> {
  const seen = {
    lastSeenAt: now.toISOString(),
    status: "connected",
  };

  await getDb()
    .insert(devices)
    .values({
      householdId,
      ...MOCK_DEVICE,
      ...seen,
    })
    .onConflictDoUpdate({
      target: [devices.householdId, devices.deviceType],
      set: seen,
    });
}
