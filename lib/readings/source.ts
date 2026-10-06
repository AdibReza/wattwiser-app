
import {
  isDeviceConnected,
  latestReading,
  listReadings,
} from "@/lib/db/queries/readings";

export type CurrentReading = {
  watts: number;
  ts: string;
  deviceConnected: boolean;
};

export type ReadingPoint = {
  ts: string;
  watts: number;
};

export interface ReadingsSource {
  current(householdId: string): Promise<CurrentReading>;
  range(
    householdId: string,
    from: Date,
    to: Date
  ): Promise<ReadingPoint[]>;
}

const databaseSource: ReadingsSource = {
  async current(householdId) {
    const now = new Date();
    const [reading, connected] = await Promise.all([
      latestReading(householdId),
      isDeviceConnected(householdId, now),
    ]);

    return {
      watts: reading?.watts ?? 0,
      ts: reading?.ts ?? now.toISOString(),
      deviceConnected: connected,
    };
  },

  async range(householdId, from, to) {
    return listReadings(householdId, from, to);
  },
};

export function getReadingsSource(): ReadingsSource {
  return databaseSource;
}
