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
const completedRuns = sql<number>`(
  select count(*)::int from calibration_sessions cs
  where cs.appliance_id = appliances.id and cs.status = 'completed'
)`;

type Row = typeof appliances.$inferSelect & { calibrationCount: number };

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

export async function listAppliances(): Promise<ApplianceSummary[]> {
  const rows = await selectWithCount().orderBy(asc(appliances.name));
  return rows.map(toSummary);
}

export async function getAppliance(id: string): Promise<Appliance | null> {
  const [row] = await selectWithCount().where(eq(appliances.id, id)).limit(1);
  return row ? toAppliance(row) : null;
}

export async function createAppliance(input: ApplianceInput): Promise<Appliance> {
  const [row] = await getDb().insert(appliances).values(clean(input)).returning({ id: appliances.id });
  return (await getAppliance(row.id))!;
}

export async function updateAppliance(id: string, input: ApplianceInput): Promise<Appliance | null> {
  const updated = await getDb().update(appliances).set(clean(input)).where(eq(appliances.id, id)).returning({ id: appliances.id });
  return updated.length ? getAppliance(id) : null;
}

/** Calibration runs and the signature go with it (FK cascade); events keep their rows and become Unknown. */
export async function deleteAppliance(id: string): Promise<boolean> {
  const deleted = await getDb().delete(appliances).where(eq(appliances.id, id)).returning({ id: appliances.id });
  return deleted.length > 0;
}

export async function listCalibrations(applianceId: string): Promise<CalibrationSummary[]> {
  const rows = await getDb()
    .select({
      id: calibrationSessions.id,
      startedAt: calibrationSessions.startedAt,
      endedAt: calibrationSessions.endedAt,
      status: calibrationSessions.status,
      durationS: sql<number | null>`extract(epoch from (${calibrationSessions.endedAt} - ${calibrationSessions.startedAt}))::int`,
    })
    .from(calibrationSessions)
    .where(and(eq(calibrationSessions.applianceId, applianceId)))
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
export async function countAppliances(): Promise<{ total: number; calibrated: number }> {
  const [row] = await getDb()
    .select({
      total: sql<number>`count(*)::int`,
      calibrated: sql<number>`count(*) filter (where ${completedRuns} > 0)::int`,
    })
    .from(appliances);
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
