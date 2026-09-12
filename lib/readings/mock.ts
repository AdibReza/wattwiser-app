import {
  getMockSwitches,
  insertReading,
  isDeviceConnected,
  latestReading,
  listReadings,
  touchMockDevice,
  type MockSwitch,
} from "@/lib/db/queries/readings";
import type { CurrentReading, ReadingPoint, ReadingsSource } from "./source";

/**
 * Mock generator — docs/specs/mock-data.md "Live generator".
 *
 *   watts = baseline drifting 300–400 W  (fridge, router, standby)
 *         + sum of currently "on" simulated appliances (toggled on /dev)
 *         + random noise ±20 W
 *
 * There is no long-running process on Vercel, so the value is computed on
 * each request from the clock and the switch state in the database. Every
 * poll also writes one `readings` row (at most one per second), which gives
 * the charts a real history and marks the simulated device as connected.
 */
const BASELINE_MID_W = 350;
const BASELINE_SWING_W = 50;
const BASELINE_PERIOD_MS = 10 * 60 * 1000; // one slow drift cycle every 10 minutes
const NOISE_W = 20;
const MIN_WRITE_GAP_MS = 900;

export function computeWatts(switches: MockSwitch[], now: Date, random = Math.random): number {
  const phase = (now.getTime() % BASELINE_PERIOD_MS) / BASELINE_PERIOD_MS;
  const baseline = BASELINE_MID_W + BASELINE_SWING_W * Math.sin(phase * 2 * Math.PI);
  const appliances = switches.filter((s) => s.isOn).reduce((sum, s) => sum + s.watts, 0);
  const noise = (random() * 2 - 1) * NOISE_W;
  return Math.max(0, Math.round(baseline + appliances + noise));
}

async function current(): Promise<CurrentReading> {
  const now = new Date();
  const switches = await getMockSwitches();
  const watts = computeWatts(switches, now);

  const last = await latestReading();
  if (!last || now.getTime() - new Date(last.ts).getTime() >= MIN_WRITE_GAP_MS) {
    await Promise.all([insertReading(now, watts), touchMockDevice(now)]);
  }

  return { watts, ts: now.toISOString(), deviceConnected: await isDeviceConnected(now) };
}

async function range(from: Date, to: Date): Promise<ReadingPoint[]> {
  return listReadings(from, to);
}

export const mockSource: ReadingsSource = { current, range };
