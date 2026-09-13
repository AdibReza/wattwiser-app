import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";
import type {
  Appliance,
  ApplianceInput,
  ApplianceSummary,
  CalibrationSummary,
} from "@/lib/validation/appliance";

const { appliances, calibrationSessions } = schema;

/**
 * "calibrated" = at least one completed calibration run.
 * Table names are written out on purpose: inside a correlated subquery Drizzle
 * emits bare column names, and "id" would then mean the session's id.
 */
// No household filter needed here: it is correlated on appliances.id, and the
// outer query is already scoped, so it can only ever see this household's runs.
const completedRuns = sql<number>`(
  select count(*)::int from calibration_sessions cs
  where cs.appliance_id = appliances.id and cs.status = 'completed'
)`;

// householdId is deliberately not in the projection — it is a scoping key, never
// part of the payload, and must not reach the wire.
type Row = Omit<typeof appliances.$inferSelect, "householdId"> & { calibrationCount: number };

function toSummary(r: Row): ApplianceSummary {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    applianceClass: r.applianceClass as ApplianceSummary["applianceClass"],
    ratedWatts: r.ratedWatts,
    calibrationCount: r.calibrationCount,
    isCalibrated: r.calibrationCount > 0,
  };
}

function toAppliance(r: Row): Appliance {
  return {
    ...toSummary(r),
    brandModel: r.brandModel,
    commonSettings: r.commonSettings,
    notes: r.notes,
    createdAt: toIso(r.createdAt),
  };
}

const selectWithCount = () =>
  getDb()
    .select({
      id: appliances.id,
      name: appliances.name,
      category: appliances.category,
      applianceClass: appliances.applianceClass,
      ratedWatts: appliances.ratedWatts,
      brandModel: appliances.brandModel,
      commonSettings: appliances.commonSettings,
      notes: appliances.notes,
      createdAt: appliances.createdAt,
      calibrationCount: completedRuns,
    })
    .from(appliances);

export async function listAppliances(householdId: string): Promise<ApplianceSummary[]> {
  const rows = await selectWithCount().where(eq(appliances.householdId, householdId)).orderBy(asc(appliances.name));
  return rows.map(toSummary);
}

/**
 * An id from another household matches nothing and comes back null, which the
 * route handler turns into a 404. That is the ownership check — there is no
 * separate one anywhere.
 */
export async function getAppliance(householdId: string, id: string): Promise<Appliance | null> {
  const [row] = await selectWithCount()
    .where(and(eq(appliances.householdId, householdId), eq(appliances.id, id)))
    .limit(1);
  return row ? toAppliance(row) : null;
}

export async function createAppliance(householdId: string, input: ApplianceInput): Promise<Appliance> {
  const [row] = await getDb()
    .insert(appliances)
    .values({ ...clean(input), householdId })
    .returning({ id: appliances.id });
  return (await getAppliance(householdId, row.id))!;
}

export async function updateAppliance(householdId: string, id: string, input: ApplianceInput): Promise<Appliance | null> {
  const updated = await getDb()
    .update(appliances)
    .set(clean(input))
    .where(and(eq(appliances.householdId, householdId), eq(appliances.id, id)))
    .returning({ id: appliances.id });
  return updated.length ? getAppliance(householdId, id) : null;
}

/** Calibration runs and the signature go with it (FK cascade); events keep their rows and become Unknown. */
export async function deleteAppliance(householdId: string, id: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(appliances)
    .where(and(eq(appliances.householdId, householdId), eq(appliances.id, id)))
    .returning({ id: appliances.id });
  return deleted.length > 0;
}

export async function listCalibrations(householdId: string, applianceId: string): Promise<CalibrationSummary[]> {
  const rows = await getDb()
    .select({
      id: calibrationSessions.id,
      startedAt: calibrationSessions.startedAt,
      endedAt: calibrationSessions.endedAt,
      status: calibrationSessions.status,
      durationS: sql<number | null>`extract(epoch from (${calibrationSessions.endedAt} - ${calibrationSessions.startedAt}))::int`,
    })
    .from(calibrationSessions)
    .where(and(eq(calibrationSessions.householdId, householdId), eq(calibrationSessions.applianceId, applianceId)))
    .orderBy(desc(calibrationSessions.startedAt));
  return rows.map((r) => ({
    id: r.id,
    startedAt: toIso(r.startedAt)!,
    endedAt: toIso(r.endedAt),
    status: r.status as CalibrationSummary["status"],
    durationS: r.durationS,
  }));
}

/** Dashboard tile: "6 appliances · 4 calibrated". */
export async function countAppliances(householdId: string): Promise<{ total: number; calibrated: number }> {
  const [row] = await getDb()
    .select({
      total: sql<number>`count(*)::int`,
      calibrated: sql<number>`count(*) filter (where ${completedRuns} > 0)::int`,
    })
    .from(appliances)
    .where(eq(appliances.householdId, householdId));
  return row ?? { total: 0, calibrated: 0 };
}

function clean(input: ApplianceInput) {
  return {
    name: input.name,
    category: input.category,
    applianceClass: input.applianceClass,
    ratedWatts: input.ratedWatts ?? null,
    brandModel: input.brandModel ?? null,
    commonSettings: input.commonSettings ?? null,
    notes: input.notes ?? null,
  };
}
