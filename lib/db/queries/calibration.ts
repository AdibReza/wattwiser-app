import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";
import type { CalibrationSession } from "@/lib/validation/calibration";

const { calibrationSessions, appliances } = schema;

type Row = typeof calibrationSessions.$inferSelect;

function toSession(r: Row): CalibrationSession {
  const started = new Date(r.startedAt).getTime();
  const ended = r.endedAt ? new Date(r.endedAt).getTime() : null;
  return {
    id: r.id,
    applianceId: r.applianceId!,
    startedAt: toIso(r.startedAt)!,
    endedAt: toIso(r.endedAt),
    status: r.status as CalibrationSession["status"],
    baselineW: r.baselineW == null ? null : Number(r.baselineW),
    durationS: ended == null ? null : Math.round((ended - started) / 1000),
  };
}

/**
 * One wizard run = exactly one row. `started_at` is the server clock, in UTC.
 * Any earlier run for the same appliance still marked `running` was abandoned
 * (tab closed mid-run); it is discarded first so stale rows never pile up.
 */
export async function startSession(applianceId: string, baselineW: number): Promise<CalibrationSession | null> {
  const db = getDb();
  const [exists] = await db.select({ id: appliances.id }).from(appliances).where(eq(appliances.id, applianceId)).limit(1);
  if (!exists) return null;

  await db
    .update(calibrationSessions)
    .set({ status: "discarded", endedAt: sql`now()` })
    .where(and(eq(calibrationSessions.applianceId, applianceId), eq(calibrationSessions.status, "running")));

  const [row] = await db
    .insert(calibrationSessions)
    .values({ applianceId, startedAt: sql`now()`, status: "running", baselineW: String(baselineW) })
    .returning();
  return toSession(row);
}

export async function getSession(id: string): Promise<CalibrationSession | null> {
  const [row] = await getDb().select().from(calibrationSessions).where(eq(calibrationSessions.id, id)).limit(1);
  return row ? toSession(row) : null;
}

/** Only a `running` session can finish; finishing twice is a no-op that returns the row. */
export async function finishSession(id: string): Promise<CalibrationSession | null> {
  const db = getDb();
  await db
    .update(calibrationSessions)
    .set({ status: "completed", endedAt: sql`now()` })
    .where(and(eq(calibrationSessions.id, id), eq(calibrationSessions.status, "running")));
  return getSession(id);
}

/** Cancel: marks `discarded`. A completed session cannot be discarded. */
export async function discardSession(id: string): Promise<CalibrationSession | null> {
  const db = getDb();
  await db
    .update(calibrationSessions)
    .set({ status: "discarded", endedAt: sql`now()` })
    .where(and(eq(calibrationSessions.id, id), eq(calibrationSessions.status, "running")));
  return getSession(id);
}
