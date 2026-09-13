import { mockSource } from "./mock";

/**
 * The one door live power comes through — docs/specs/mock-data.md.
 * Today it is the mock generator. When the Shelly pipeline runs, add
 * `shelly.ts` implementing the same interface and change ONLY this file.
 */
export type CurrentReading = { watts: number; ts: string; deviceConnected: boolean };
export type ReadingPoint = { ts: string; watts: number };

export interface ReadingsSource {
  /** The whole-house power right now, for one household's meter. */
  current(householdId: string): Promise<CurrentReading>;
  /** Readings between two instants (UTC), oldest first, for charts. */
  range(householdId: string, from: Date, to: Date): Promise<ReadingPoint[]>;
}

export function getReadingsSource(): ReadingsSource {
  return mockSource;
}
