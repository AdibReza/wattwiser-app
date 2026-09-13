/**
 * Contamination guard — docs/specs/screens.md §5.
 * Before a run starts, total power must be steady: within 50 W over 5 seconds.
 * Otherwise something else in the house is switching on and off and would
 * pollute the signature.
 *
 * "Over 5 seconds" is measured in time, not in a count of samples: on a slow
 * connection a reading may only arrive every few seconds, and a count-based
 * check would never pass.
 */
export const STABILITY_WINDOW_S = 5;
export const STABILITY_MAX_SWING_W = 50;
/** A reading older than this before the window is too stale to vouch for its start. */
const MAX_GAP_S = 10;

export type Sample = { ts: string; watts: number };

/**
 * The samples covering the last `windowS` seconds, oldest first: everything inside
 * the window, plus the last sample just before it — power holds between readings,
 * so that sample is what the meter showed when the window opened.
 */
export function recentSamples(samples: Sample[], nowMs: number, windowS = STABILITY_WINDOW_S): Sample[] {
  const cutoff = nowMs - windowS * 1000;
  const sorted = samples
    .map((s) => ({ s, t: new Date(s.ts).getTime() }))
    .filter(({ t }) => t <= nowMs)
    .sort((a, b) => a.t - b.t);
  const firstInside = sorted.findIndex(({ t }) => t >= cutoff);
  if (firstInside === -1) return [];
  const before = sorted[firstInside - 1];
  const start = before && before.t >= cutoff - MAX_GAP_S * 1000 ? firstInside - 1 : firstInside;
  return sorted.slice(start).map(({ s }) => s);
}

export type Stability =
  | { state: "waiting"; have: number; need: number } // seconds of steady history so far, seconds needed
  | { state: "unstable"; swingW: number }
  | { state: "stable"; meanW: number; swingW: number };

export function assessStability(
  samples: Sample[],
  nowMs: number,
  windowS = STABILITY_WINDOW_S,
  maxSwingW = STABILITY_MAX_SWING_W
): Stability {
  const recent = recentSamples(samples, nowMs, windowS);
  const coveredS = recent.length ? (nowMs - new Date(recent[0].ts).getTime()) / 1000 : 0;
  const values = recent.map((s) => s.watts);
  const swingW = values.length ? Math.max(...values) - Math.min(...values) : 0;
  // A jump shows up as soon as it happens, even before the window is full.
  if (swingW >= maxSwingW) return { state: "unstable", swingW };
  if (recent.length < 2 || coveredS < windowS) return { state: "waiting", have: Math.min(coveredS, windowS), need: windowS };
  const meanW = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return { state: "stable", meanW, swingW };
}
