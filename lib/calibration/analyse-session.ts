import { and, asc, eq, gte, lte, sql } from "drizzle-orm";

import { getDb, schema } from "@/lib/db/client";

import type { CalibrationSession } from "@/lib/validation/calibration";

import {
  extractCalibrationFeatures,
  type CalibrationReading,
} from "@/lib/calibration/features";

const {
  readings,
  devices,
  applianceSignatures,
  calibrationSamples,
} = schema;

const REAL_DEVICE_TYPE = "shelly_em_gen3";

const MIN_SAMPLES = 6;
const POWER_CHANGE_THRESHOLD_W = 50;
const MAX_GAP_MS = 45_000;

type Point = CalibrationReading;

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
  if (values.length === 0) return 0;

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
 * Analyse actual Shelly EM Gen3 measurements recorded between
 * the calibration session's server timestamps.
 *
 * Calibration flow:
 *
 * 1. Validate the completed calibration session.
 * 2. Retrieve real Shelly readings.
 * 3. Validate sample count and timestamp gaps.
 * 4. Detect the appliance ON boundary.
 * 5. Detect the appliance OFF boundary.
 * 6. Separate baseline, active, and off readings.
 * 7. Extract electrical and power features.
 * 8. Save one calibration sample for this run.
 * 9. Update the current appliance signature.
 */
export async function analyseAndSaveCalibration(
  householdId: string,
  session: CalibrationSession
): Promise<CalibrationAnalysis> {
  if (!session.endedAt || session.status !== "completed") {
    return invalid(
      "The calibration session is not finished.",
      0
    );
  }

  if (
    session.baselineW == null ||
    !Number.isFinite(session.baselineW) ||
    session.baselineW < 0
  ) {
    return invalid(
      "The starting power measurement is invalid.",
      0
    );
  }

  const db = getDb();

  /*
   * ------------------------------------------------------------
   * Retrieve real Shelly EM Gen3 measurements
   * ------------------------------------------------------------
   */

  const rows = await db
    .select({
      ts: readings.ts,
      watts: readings.watts,
      volts: readings.volts,
      amps: readings.amps,
      powerFactor: readings.powerFactor,
      apparentPowerVa: readings.apparentPowerVa,
      frequencyHz: readings.frequencyHz,
    })
    .from(readings)
    .innerJoin(
      devices,
      eq(readings.deviceId, devices.id)
    )
    .where(
      and(
        eq(readings.householdId, householdId),
        eq(
          devices.deviceType,
          REAL_DEVICE_TYPE
        ),
        gte(
          readings.ts,
          session.startedAt
        ),
        lte(
          readings.ts,
          session.endedAt
        )
      )
    )
    .orderBy(asc(readings.ts));

  console.log(
    "[CALIBRATION] Database rows retrieved:",
    rows.length
  );

  /*
   * ------------------------------------------------------------
   * Normalize and deduplicate readings
   * ------------------------------------------------------------
   */

  const byTimestamp =
    new Map<number, Point>();

  for (const row of rows) {
    const timestamp =
      new Date(row.ts).getTime();

    const watts = Number(row.watts);

    if (
      !Number.isFinite(timestamp) ||
      !Number.isFinite(watts) ||
      watts < 0
    ) {
      continue;
    }

    byTimestamp.set(timestamp, {
      ts: new Date(
        timestamp
      ).toISOString(),

      watts,

      volts:
        row.volts !== null
          ? Number(row.volts)
          : null,

      amps:
        row.amps !== null
          ? Number(row.amps)
          : null,

      powerFactor:
        row.powerFactor !== null
          ? Number(row.powerFactor)
          : null,

      apparentPowerVa:
        row.apparentPowerVa !== null
          ? Number(
              row.apparentPowerVa
            )
          : null,

      frequencyHz:
        row.frequencyHz !== null
          ? Number(row.frequencyHz)
          : null,
    });
  }

  const points = [
    ...byTimestamp.values(),
  ].sort(
    (a, b) =>
      Date.parse(a.ts) -
      Date.parse(b.ts)
  );

  console.log(
    "[CALIBRATION] Valid real Shelly points:",
    points.length
  );

  if (points.length === 0) {
    return invalid(
      "No real Shelly measurements were found in the calibration time window.",
      0
    );
  }

  /*
   * ------------------------------------------------------------
   * Minimum sample validation
   * ------------------------------------------------------------
   */

  if (points.length < MIN_SAMPLES) {
    return invalid(
      `Not enough Shelly measurements. Found ${points.length}, need at least ${MIN_SAMPLES}.`,
      points.length
    );
  }

  /*
   * ------------------------------------------------------------
   * Timestamp gap validation
   * ------------------------------------------------------------
   */

  const timestamps = points.map(
    (point) => Date.parse(point.ts)
  );

  let maxGapMs = 0;

  for (
    let i = 1;
    i < timestamps.length;
    i++
  ) {
    const gap =
      timestamps[i] -
      timestamps[i - 1];

    maxGapMs = Math.max(
      maxGapMs,
      gap
    );
  }

  console.log(
    "[CALIBRATION] Maximum reading gap:",
    maxGapMs,
    "ms"
  );

  if (maxGapMs > MAX_GAP_MS) {
    return invalid(
      `Shelly measurement gap is too large: ${Math.round(
        maxGapMs / 1000
      )} seconds. Maximum allowed is ${Math.round(
        MAX_GAP_MS / 1000
      )} seconds.`,
      points.length
    );
  }

  /*
   * ------------------------------------------------------------
   * Baseline
   * ------------------------------------------------------------
   */

  const baselineW =
    session.baselineW;

  const deltas = points.map(
    (point) =>
      point.watts - baselineW
  );

  console.log(
    "[CALIBRATION] Baseline:",
    baselineW
  );

  console.log(
    "[CALIBRATION] Watt values:",
    points.map(
      (point) => point.watts
    )
  );

  console.log(
    "[CALIBRATION] Deltas:",
    deltas
  );

  /*
   * ------------------------------------------------------------
   * Detect appliance ON boundary
   * ------------------------------------------------------------
   *
   * The appliance is considered active when the measured
   * whole-house power is at least 50 W above the calibration
   * baseline.
   */

  const baselineThresholdW =
    baselineW +
    POWER_CHANGE_THRESHOLD_W;

  const firstActive =
    points.findIndex(
      (point) =>
        point.watts >=
        baselineThresholdW
    );

  if (firstActive === -1) {
    return invalid(
      `No calibration ON event detected. Power never increased by at least ${POWER_CHANGE_THRESHOLD_W} W above the baseline.`,
      points.length
    );
  }

  if (firstActive < 1) {
    return invalid(
      "Not enough baseline measurements before the appliance ON event.",
      points.length
    );
  }

  console.log(
    "[CALIBRATION] First active index:",
    firstActive
  );

  /*
   * ------------------------------------------------------------
   * Detect appliance OFF boundary
   * ------------------------------------------------------------
   *
   * Require two consecutive readings to return within the
   * 50 W baseline window.
   *
   * This helps prevent one noisy reading from being interpreted
   * as the appliance turning off.
   */

  let firstOff = -1;

  for (
    let i = firstActive + 1;
    i < points.length - 1;
    i++
  ) {
    const currentNearBaseline =
      Math.abs(
        points[i].watts -
          baselineW
      ) <=
      POWER_CHANGE_THRESHOLD_W;

    const nextNearBaseline =
      Math.abs(
        points[i + 1].watts -
          baselineW
      ) <=
      POWER_CHANGE_THRESHOLD_W;

    if (
      currentNearBaseline &&
      nextNearBaseline
    ) {
      firstOff = i;
      break;
    }
  }

  if (firstOff === -1) {
    return invalid(
      "Calibration ON event was detected, but the appliance did not return toward the baseline.",
      points.length
    );
  }

  console.log(
    "[CALIBRATION] First off index:",
    firstOff
  );

  /*
   * ------------------------------------------------------------
   * Split calibration readings
   * ------------------------------------------------------------
   *
   * baselinePoints:
   *   readings before the appliance turns ON
   *
   * activePoints:
   *   readings while the appliance is active
   *
   * offPoints:
   *   readings after the appliance returns toward baseline
   */

  const baselinePoints =
    points.slice(
      0,
      firstActive
    );

  const activePoints =
    points.slice(
      firstActive,
      firstOff
    );

  const offPoints =
    points.slice(firstOff);

  const offTrace = offPoints;

  console.log(
    "[CALIBRATION] Baseline points:",
    baselinePoints.length
  );

  console.log(
    "[CALIBRATION] Active points:",
    activePoints.length
  );

  console.log(
    "[CALIBRATION] Off points:",
    offPoints.length
  );

  if (activePoints.length < 2) {
    return invalid(
      "Not enough measurements were captured during the appliance ON period.",
      points.length
    );
  }

  if (offPoints.length < 2) {
    return invalid(
      "Not enough measurements were captured after the appliance returned toward baseline.",
      points.length
    );
  }

  /*
   * ------------------------------------------------------------
   * Calculate ON/OFF power changes
   * ------------------------------------------------------------
   */

  const activeMedianW =
    median(
      activePoints.map(
        (point) =>
          point.watts
      )
    );

  const offMedianW =
    median(
      offPoints.map(
        (point) =>
          point.watts
      )
    );

  const deltaOnW =
    activeMedianW -
    baselineW;

  const deltaOffW =
    activeMedianW -
    offMedianW;

  console.log(
    "[CALIBRATION] Active median W:",
    activeMedianW
  );

  console.log(
    "[CALIBRATION] Off median W:",
    offMedianW
  );

  console.log(
    "[CALIBRATION] deltaOnW:",
    deltaOnW
  );

  console.log(
    "[CALIBRATION] deltaOffW:",
    deltaOffW
  );

  /*
   * The detected ON change must be meaningful.
   */

  if (
    deltaOnW <
    POWER_CHANGE_THRESHOLD_W
  ) {
    return invalid(
      `Detected ON event is too small: ${deltaOnW.toFixed(
        1
      )} W.`,
      points.length
    );
  }

  /*
   * The OFF section should return reasonably close to
   * the original baseline.
   */

  const offDifferenceW =
    Math.abs(
      offMedianW -
        baselineW
    );

  if (
    offDifferenceW >
    POWER_CHANGE_THRESHOLD_W
  ) {
    return invalid(
      `Power did not return close enough to the baseline after the calibration event. Off level differs by ${offDifferenceW.toFixed(
        1
      )} W.`,
      points.length
    );
  }

  /*
   * ------------------------------------------------------------
   * Duration
   * ------------------------------------------------------------
   *
   * Sampling timestamps bound the transition; they do not reveal
   * its exact moment.
   */

  const observedDurationS =
    Math.max(
      1,
      Math.round(
        (
          timestamps[firstOff] -
          timestamps[firstActive]
        ) / 1000
      )
    );

  const uncertaintyS =
    Math.ceil(
      maxGapMs / 1000
    );

  const durationMinS =
    Math.max(
      1,
      observedDurationS -
        2 * uncertaintyS
    );

  const durationMaxS =
    observedDurationS +
    2 * uncertaintyS;

  /*
   * ------------------------------------------------------------
   * Confidence
   * ------------------------------------------------------------
   */

  const confidence:
    | "high"
    | "medium"
    | "low" =
    points.length >= 12 &&
    maxGapMs <= 20_000
      ? "high"
      : points.length >= 8
        ? "medium"
        : "low";

  /*
   * ------------------------------------------------------------
   * Rich feature extraction
   * ------------------------------------------------------------
   */

  const features =
    extractCalibrationFeatures(
      baselinePoints,
      activePoints,
      baselineW
    );

  console.log(
    "[CALIBRATION] Extracted features:",
    features
  );

  /*
   * ------------------------------------------------------------
   * Build stored signature pattern
   * ------------------------------------------------------------
   */

  const pattern = {
    baseline:
      features.baseline,

    baselineTrace:
      features.baselineTrace,

    power:
      features.power,

    electrical:
      features.electrical,

    transitions:
      features.transitions,

    durationS:
      features.durationS,

    trace:
      features.trace,
  };

  console.log(
    "[CALIBRATION] Signature pattern:",
    pattern
  );

  /*
   * ------------------------------------------------------------
   * Save individual calibration sample
   * ------------------------------------------------------------
   *
   * This preserves every calibration run as a separate
   * ML/data-generation sample.
   */

  const calibrationSample = {
    householdId,

    calibrationSessionId:
      session.id,

    applianceId:
      session.applianceId,

    baselineW:
      String(session.baselineW),

    deltaOnW:
      String(
        Math.round(
          deltaOnW * 10
        ) / 10
      ),

    deltaOffW:
      String(
        Math.round(
          deltaOffW * 10
        ) / 10
      ),

    durationS:
      String(
        features.durationS
      ),

    features,

    baselineTrace:
      features.baselineTrace,

    activeTrace:
      features.trace,

    offTrace,
  };

  console.log(
    "[CALIBRATION] Saving calibration sample..."
  );

  await db
    .insert(calibrationSamples)
    .values(
      calibrationSample
    );

  console.log(
    "[CALIBRATION] Calibration sample saved successfully."
  );

  /*
   * ------------------------------------------------------------
   * Find existing appliance signature
   * ------------------------------------------------------------
   */

  const [existing] =
    await db
      .select({
        id:
          applianceSignatures.id,
      })
      .from(
        applianceSignatures
      )
      .where(
        and(
          eq(
            applianceSignatures.householdId,
            householdId
          ),
          eq(
            applianceSignatures.applianceId,
            session.applianceId
          )
        )
      )
      .limit(1);

  const signatureValues = {
    deltaOnW:
      String(
        Math.round(
          deltaOnW * 10
        ) / 10
      ),

    deltaOffW:
      String(
        Math.round(
          deltaOffW * 10
        ) / 10
      ),

    durationMinS,

    durationMaxS,

    pattern,

    sampleCount:
      points.length,

    confidence,

    updatedAt:
      sql`now()`,
  };

  /*
   * ------------------------------------------------------------
   * Update or create current appliance signature
   * ------------------------------------------------------------
   */

  if (existing) {
    console.log(
      "[CALIBRATION] Updating existing signature:",
      existing.id
    );

    await db
      .update(
        applianceSignatures
      )
      .set(
        signatureValues
      )
      .where(
        and(
          eq(
            applianceSignatures.id,
            existing.id
          ),
          eq(
            applianceSignatures.householdId,
            householdId
          )
        )
      );
  } else {
    console.log(
      "[CALIBRATION] Creating new signature for appliance:",
      session.applianceId
    );

    await db
      .insert(
        applianceSignatures
      )
      .values({
        householdId,

        applianceId:
          session.applianceId,

        ...signatureValues,
      });
  }

  console.log(
    "[CALIBRATION] Signature saved successfully."
  );

  /*
   * ------------------------------------------------------------
   * Final result
   * ------------------------------------------------------------
   */

  return {
    valid: true,

    reason:
      "Calibration measurements were successfully detected, analysed, and saved.",

    sampleCount:
      points.length,

    deltaOnW:
      Math.round(
        deltaOnW * 10
      ) / 10,

    deltaOffW:
      Math.round(
        deltaOffW * 10
      ) / 10,

    durationMinS,

    durationMaxS,

    confidence,

    signatureSaved: true,
  };
}