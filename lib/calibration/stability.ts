/**
 * Contamination guard — docs/specs/screens.md §5.
 * Before a run starts, total power must be steady: within 50 W over 5 seconds.
 * Otherwise something else in the house is switching on and off and would
 * pollute the signature.
 */
export const STABILITY_WINDOW_S = 5;
export const STABILITY_MAX_SWING_W = 50;

export type Sample = { ts: string; watts: number };

/** The samples from the last `windowS` seconds, oldest first. */
export function recentSamples(samples: Sample[], nowMs: number, windowS = STABILITY_WINDOW_S): Sample[] {
  const cutoff = nowMs - windowS * 1000;
  return samples.filter((s) => new Date(s.ts).getTime() >= cutoff);
}

export type Stability =
  | { state: "waiting"; have: number; need: number } // not enough samples yet
  | { state: "unstable"; swingW: number }
  | { state: "stable"; meanW: number; swingW: number };

export function assessStability(
  samples: Sample[],
  nowMs: number,
  windowS = STABILITY_WINDOW_S,
  maxSwingW = STABILITY_MAX_SWING_W
): Stability {
  const recent = recentSamples(samples, nowMs, windowS);
  if (recent.length < windowS) return { state: "waiting", have: recent.length, need: windowS };
  const values = recent.map((s) => s.watts);
  const swingW = Math.max(...values) - Math.min(...values);
  if (swingW >= maxSwingW) return { state: "unstable", swingW };
  const meanW = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { state: "stable", meanW, swingW };
}
