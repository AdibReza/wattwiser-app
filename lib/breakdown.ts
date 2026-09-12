import { costForRows, splitPeak } from "@/lib/tariff";
import { confidenceFromScore, type Confidence } from "@/lib/format";
import type { MonthEvent } from "@/lib/db/queries/breakdown";
import type { TariffConfig } from "@/lib/validation/household";

export type BreakdownItem = {
  applianceId: string | null; // null = the Unknown bucket
  appliance: string;
  kwh: number;
  percent: number;
  cost: number | null;
  confidence: Confidence; // null for Unknown — not a value, an absence
  runs: number;
  lastRunAt: string | null;
};

export type Breakdown = {
  month: string;
  totalKwh: number;
  totalCost: number | null;
  identifiedPercent: number;
  items: BreakdownItem[];
  recent: { id: string; appliance: string; applianceId: string | null; startedAt: string; endedAt: string | null; kwh: number }[];
};

const UNKNOWN = "Unknown / Other";

/**
 * Turn a month of detected runs into the breakdown — docs/specs/screens.md §6.
 * The Unknown bucket is always present, even at 0 kWh: never pretend every
 * watt can be assigned. Confidence is averaged weighted by energy, then shown
 * as High / Medium / Low; the Unknown row has none.
 */
export function buildBreakdown(month: string, evts: MonthEvent[], tariff: TariffConfig | null): Breakdown {
  type Acc = { name: string; kwh: number; peakKwh: number; offPeakKwh: number; runs: number; lastRunAt: string | null; confSum: number; confKwh: number };
  const groups = new Map<string, Acc>();
  const key = (e: MonthEvent) => e.applianceId ?? "unknown";

  for (const e of evts) {
    const k = key(e);
    const acc =
      groups.get(k) ??
      { name: e.applianceName ?? UNKNOWN, kwh: 0, peakKwh: 0, offPeakKwh: 0, runs: 0, lastRunAt: null, confSum: 0, confKwh: 0 };
    const ended = e.endedAt ? new Date(e.endedAt) : new Date(e.startedAt);
    const { peakKwh, offPeakKwh } = splitPeak(new Date(e.startedAt), ended, e.energyKwh);
    acc.kwh += e.energyKwh;
    acc.peakKwh += peakKwh;
    acc.offPeakKwh += offPeakKwh;
    acc.runs += 1;
    if (!acc.lastRunAt || e.startedAt > acc.lastRunAt) acc.lastRunAt = e.startedAt;
    if (e.confidence != null) {
      acc.confSum += e.confidence * e.energyKwh;
      acc.confKwh += e.energyKwh;
    }
    groups.set(k, acc);
  }

  // The Unknown bucket is always a row, even when empty.
  if (!groups.has("unknown")) {
    groups.set("unknown", { name: UNKNOWN, kwh: 0, peakKwh: 0, offPeakKwh: 0, runs: 0, lastRunAt: null, confSum: 0, confKwh: 0 });
  }

  const entries = [...groups.entries()];
  const costs = costForRows(entries.map(([, a]) => a), tariff);
  const totalKwh = entries.reduce((s, [, a]) => s + a.kwh, 0);

  const items: BreakdownItem[] = entries.map(([k, a], i) => ({
    applianceId: k === "unknown" ? null : k,
    appliance: a.name,
    kwh: round(a.kwh, 1),
    percent: totalKwh > 0 ? round((a.kwh / totalKwh) * 100, 1) : 0,
    cost: costs ? round(costs[i], 2) : null,
    confidence: k === "unknown" || a.confKwh === 0 ? null : confidenceFromScore(a.confSum / a.confKwh),
    runs: a.runs,
    lastRunAt: a.lastRunAt,
  }));

  // Biggest first; the Unknown row is always pinned to the bottom, never hidden.
  items.sort((x, y) => (x.applianceId === null ? 1 : y.applianceId === null ? -1 : y.kwh - x.kwh));

  const unknownKwh = items.find((i) => i.applianceId === null)?.kwh ?? 0;
  const totalCost = costs ? round(costs.reduce((s, c) => s + c, 0), 2) : null;

  return {
    month,
    totalKwh: round(totalKwh, 1),
    totalCost,
    identifiedPercent: totalKwh > 0 ? round(((totalKwh - unknownKwh) / totalKwh) * 100, 0) : 0,
    items,
    recent: evts.slice(0, 20).map((e) => ({
      id: e.id,
      appliance: e.applianceName ?? UNKNOWN,
      applianceId: e.applianceId,
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      kwh: round(e.energyKwh, 2),
    })),
  };
}

function round(n: number, dp: number) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
