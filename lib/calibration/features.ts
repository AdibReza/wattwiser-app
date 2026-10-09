export type CalibrationReading = {
  ts: string;
  watts: number;
  volts?: number | null;
  amps?: number | null;
  powerFactor?: number | null;
  apparentPowerVa?: number | null;
  frequencyHz?: number | null;
};

export type BaselineFeatures = {
  meanW: number;
  medianW: number;
  minW: number;
  maxW: number;
  stdW: number;
};

export type PowerFeatures = {
  meanW: number;
  medianW: number;
  minW: number;
  maxW: number;
  peakW: number;
  stdW: number;
  deltaMeanW: number;
  deltaPeakW: number;
};

export type ElectricalFeatures = {
  meanVoltage?: number;
  meanCurrentA?: number;
  meanPowerFactor?: number;
  meanApparentPowerVa?: number;
  meanFrequencyHz?: number;
};

export type TransitionFeatures = {
  riseTimeS?: number;
  fallTimeS?: number;
  maxRiseRateWPerS?: number;
  maxFallRateWPerS?: number;
};

export type CalibrationTracePoint = {
  elapsedS: number;
  watts: number;
  wattsAboveBaseline: number;
  volts?: number | null;
  amps?: number | null;
  powerFactor?: number | null;
  apparentPowerVa?: number | null;
  frequencyHz?: number | null;
};

export type CalibrationFeatures = {
  baseline: BaselineFeatures;
  baselineTrace: CalibrationTracePoint[];
  power: PowerFeatures;
  electrical: ElectricalFeatures;
  transitions: TransitionFeatures;
  durationS: number;
  trace: CalibrationTracePoint[];
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;

  return (
    values.reduce((sum, value) => sum + value, 0) /
    values.length
  );
}

function median(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;

  const average = mean(values);

  const variance =
    values.reduce(
      (sum, value) => sum + (value - average) ** 2,
      0
    ) / values.length;

  return Math.sqrt(variance);
}

function averageOptional(
  values: Array<number | null | undefined>
): number | undefined {
  const valid = values.filter(
    (value): value is number =>
      value != null && Number.isFinite(value)
  );

  return valid.length ? mean(valid) : undefined;
}

function createTrace(
  points: CalibrationReading[],
  baselineW: number,
  startTimestampMs: number
): CalibrationTracePoint[] {
  return points.map((point) => ({
    elapsedS: Math.round(
      (Date.parse(point.ts) - startTimestampMs) / 1000
    ),
    watts: point.watts,
    wattsAboveBaseline:
      Math.round((point.watts - baselineW) * 10) / 10,
    volts: point.volts,
    amps: point.amps,
    powerFactor: point.powerFactor,
    apparentPowerVa: point.apparentPowerVa,
    frequencyHz: point.frequencyHz,
  }));
}

export function extractCalibrationFeatures(
  baselinePoints: CalibrationReading[],
  activePoints: CalibrationReading[],
  baselineW: number
): CalibrationFeatures {
  const baselineWatts = baselinePoints.map(
    (point) => point.watts
  );

  const activeWatts = activePoints.map(
    (point) => point.watts
  );

  const baseline: BaselineFeatures = {
    meanW: mean(baselineWatts),
    medianW: median(baselineWatts),
    minW: baselineWatts.length
      ? Math.min(...baselineWatts)
      : baselineW,
    maxW: baselineWatts.length
      ? Math.max(...baselineWatts)
      : baselineW,
    stdW: standardDeviation(baselineWatts),
  };

  const activeMeanW = mean(activeWatts);
  const activeMedianW = median(activeWatts);

  const activeMinW = activeWatts.length
    ? Math.min(...activeWatts)
    : baselineW;

  const activeMaxW = activeWatts.length
    ? Math.max(...activeWatts)
    : baselineW;

  const power: PowerFeatures = {
    meanW: activeMeanW,
    medianW: activeMedianW,
    minW: activeMinW,
    maxW: activeMaxW,
    peakW: activeMaxW,
    stdW: standardDeviation(activeWatts),
    deltaMeanW: activeMeanW - baselineW,
    deltaPeakW: activeMaxW - baselineW,
  };

  const electrical: ElectricalFeatures = {
    meanVoltage: averageOptional(
      activePoints.map((point) => point.volts)
    ),
    meanCurrentA: averageOptional(
      activePoints.map((point) => point.amps)
    ),
    meanPowerFactor: averageOptional(
      activePoints.map(
        (point) => point.powerFactor
      )
    ),
    meanApparentPowerVa: averageOptional(
      activePoints.map(
        (point) => point.apparentPowerVa
      )
    ),
    meanFrequencyHz: averageOptional(
      activePoints.map(
        (point) => point.frequencyHz
      )
    ),
  };

  let maxRiseRateWPerS = 0;
  let maxFallRateWPerS = 0;

  for (let i = 1; i < activePoints.length; i++) {
    const previous = activePoints[i - 1];
    const current = activePoints[i];

    const previousTs = Date.parse(previous.ts);
    const currentTs = Date.parse(current.ts);

    const elapsedS =
      (currentTs - previousTs) / 1000;

    if (elapsedS <= 0) continue;

    const rate =
      (current.watts - previous.watts) /
      elapsedS;

    maxRiseRateWPerS = Math.max(
      maxRiseRateWPerS,
      rate
    );

    maxFallRateWPerS = Math.max(
      maxFallRateWPerS,
      -rate
    );
  }

  const first = activePoints[0];
  const last =
    activePoints[activePoints.length - 1];

  const durationS =
    first && last
      ? Math.max(
          0,
          (Date.parse(last.ts) -
            Date.parse(first.ts)) /
            1000
        )
      : 0;

  const baselineStartTimestampMs =
    baselinePoints.length > 0
      ? Date.parse(baselinePoints[0].ts)
      : Date.parse(first?.ts ?? new Date().toISOString());

  const activeStartTimestampMs =
    first
      ? Date.parse(first.ts)
      : baselineStartTimestampMs;

  const baselineTrace = createTrace(
    baselinePoints,
    baselineW,
    baselineStartTimestampMs
  );

  const trace = createTrace(
    activePoints,
    baselineW,
    activeStartTimestampMs
  );

  return {
    baseline,
    baselineTrace,
    power,
    electrical,
    transitions: {
      maxRiseRateWPerS,
      maxFallRateWPerS,
    },
    durationS,
    trace,
  };
}