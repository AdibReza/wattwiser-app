
import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import type { CalibrationSession } from "@/lib/validation/calibration";

const { readings, devices, applianceSignatures } = schema;

const REAL_DEVICE_TYPE = "shelly_em_gen3";
const MIN_SAMPLES = 6;
const POWER_CHANGE_THRESHOLD_W = 50;
const MAX_GAP_MS = 45_000;

type Point = {
  ts: string;
  watts: number;
};

export type CalibrationAnalysis = {
  valid: boolean;
  reason: string;
  sampleCount: number;
  deltaOnW?: number;
  deltaOffW?: number;
  durationMinS?: number;
  durationMaxS?: number;
  confidence?: "high" | "medium" | "low";
  signatureSaved: boolean;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function invalid(
  reason: string,
  sampleCount: number
): CalibrationAnalysis {
  return {
    valid: false,
    reason,
    sampleCount,
    signatureSaved: false,
  };
}

/**
 * Analyse only actual Shelly EM Gen3 measurements recorded
 * between the calibration session's server timestamps.
 *
 * A successful result means the data passed these basic checks.
 * It does not prove that no other appliance was operating.
 */
export async function analyseAndSaveCalibration(
  householdId: string,
  session: CalibrationSession
): Promise<CalibrationAnalysis> {
  if (!session.endedAt || session.status !== "completed") {
    return invalid("The calibration session is not finished.", 0);
  }

  if (
    session.baselineW == null ||
    !Number.isFinite(session.baselineW) ||
    session.baselineW < 0
  ) {
    return invalid("The starting power measurement is invalid.", 0);
  }

  const db = getDb();

  const rows = await db
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
        gte(readings.ts, session.startedAt),
        lte(readings.ts, session.endedAt)
      )
    )
    .orderBy(asc(readings.ts));

  const byTimestamp = new Map<number, Point>();

  for (const row of rows) {
    const timestamp = new Date(row.ts).getTime();
    const watts = Number(row.watts);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(watts) ||
      watts < 0
    ) {
      continue;
    }

    byTimestamp.set(timestamp, {
      ts: new Date(timestamp).toISOString(),
      watts,
    });
  }

  const points = [...byTimestamp.values()].sort(
    (a, b) => Date.parse(a.ts) - Date.parse(b.ts)
  );

  if (points.length < MIN_SAMPLES) {
    return invalid(
      `Not enough real measurements: ${points.length} found; at least ${MIN_SAMPLES} are required.`,
      points.length
    );
  }

  const timestamps = points.map((point) => Date.parse(point.ts));
  let maxGapMs = 0;

  for (let i = 1; i < timestamps.length; i++) {
    maxGapMs = Math.max(
      maxGapMs,
      timestamps[i] - timestamps[i - 1]
    );
  }

  if (maxGapMs > MAX_GAP_MS) {
    return invalid(
      "There is a large gap in the measurements. Repeat the calibration when readings are arriving consistently.",
      points.length
    );
  }

  const baselineW = session.baselineW;
  const deltas = points.map((point) => point.watts - baselineW);

  // The readings must first show the appliance's off-state.
  const firstActive = deltas.findIndex(
    (delta) => delta >= POWER_CHANGE_THRESHOLD_W
  );

  if (firstActive < 1) {
    return invalid(
      "A clear off-to-on power change was not captured after the starting point.",
      points.length
    );
  }

  // Require two consecutive measurements back near baseline
  // before treating a later point as the end of the active event.
  let firstOff = -1;

  for (let i = firstActive + 1; i < points.length - 1; i++) {
    const currentIsOff =
      Math.abs(deltas[i]) < POWER_CHANGE_THRESHOLD_W;
    const nextIsOff =
      Math.abs(deltas[i + 1]) < POWER_CHANGE_THRESHOLD_W;

    if (currentIsOff && nextIsOff) {
      firstOff = i;
      break;
    }
  }

  if (firstOff < 0) {
    return invalid(
      "A clear return to the starting power was not captured. Switch the appliance off, wait for more readings, and finish again.",
      points.length
    );
  }

  const activePoints = points.slice(firstActive, firstOff);
  const offPoints = points.slice(firstOff);

  if (activePoints.length < 2 || offPoints.length < 2) {
    return invalid(
      "There are not enough measurements to validate the on/off change.",
      points.length
    );
  }

  const activeMedianW = median(
    activePoints.map((point) => point.watts)
  );

  const offMedianW = median(
    offPoints.map((point) => point.watts)
  );

  const deltaOnW = activeMedianW - baselineW;
  const deltaOffW = activeMedianW - offMedianW;

  if (
    deltaOnW < POWER_CHANGE_THRESHOLD_W ||
    deltaOffW < POWER_CHANGE_THRESHOLD_W
  ) {
    return invalid(
      "The measured power change is too small to form a reliable signature.",
      points.length
    );
  }

  // Sampling timestamps only bound the transition; they do not
  // reveal its exact moment.
  const observedDurationS = Math.max(
    1,
    Math.round(
      (timestamps[firstOff] - timestamps[firstActive]) / 1000
    )
  );

  const uncertaintyS = Math.ceil(maxGapMs / 1000);

  const durationMinS = Math.max(
    1,
    observedDurationS - 2 * uncertaintyS
  );

  const durationMaxS =
    observedDurationS + 2 * uncertaintyS;

  const confidence: "high" | "medium" | "low" =
    points.length >= 12 && maxGapMs <= 20_000
      ? "high"
      : points.length >= 8
        ? "medium"
        : "low";

  const pattern = activePoints.map((point) => ({
    elapsedS: Math.round(
      (Date.parse(point.ts) - timestamps[firstActive]) / 1000
    ),
    wattsAboveBaseline: Math.round(
      (point.watts - baselineW) * 10
    ) / 10,
  }));

  const [existing] = await db
    .select({ id: applianceSignatures.id })
    .from(applianceSignatures)
    .where(
      and(
        eq(applianceSignatures.householdId, householdId),
        eq(applianceSignatures.applianceId, session.applianceId)
      )
    )
    .limit(1);

  const signatureValues = {
    deltaOnW: String(Math.round(deltaOnW * 10) / 10),
    deltaOffW: String(Math.round(deltaOffW * 10) / 10),
    durationMinS,
    durationMaxS,
    pattern,
    sampleCount: points.length,
    confidence,
    updatedAt: sql`now()`,
  };

  if (existing) {
    await db
      .update(applianceSignatures)
      .set(signatureValues)
      .where(
        and(
          eq(applianceSignatures.id, existing.id),
          eq(applianceSignatures.householdId, householdId)
        )
      );
  } else {
    await db.insert(applianceSignatures).values({
      householdId,
      applianceId: session.applianceId,
      ...signatureValues,
    });
  }

  return {
    valid: true,
    reason: "The measurements passed the initial calibration checks.",
    sampleCount: points.length,
    deltaOnW: Math.round(deltaOnW * 10) / 10,
    deltaOffW: Math.round(deltaOffW * 10) / 10,
    durationMinS,
    durationMaxS,
    confidence,
    signatureSaved: true,
  };
}
