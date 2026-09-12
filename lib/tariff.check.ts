/**
 * Checks for the cost maths — run with `just check` (or `pnpm check:maths`).
 *
 * No test framework on purpose: these are pure functions and this file is a
 * plain script that prints PASS/FAIL and exits non-zero on failure. It exists
 * because the tariff rules carry assumptions (peak window, household timezone)
 * that a future change could break without any screen looking wrong.
 */
import { costForRows, monthRange, splitPeak, localToUtc } from "@/lib/tariff";
import { buildBreakdown } from "@/lib/breakdown";

let failures = 0;
const ok = (label: string, got: unknown, want: unknown) => {
  const pass = JSON.stringify(got) === JSON.stringify(want);
  if (!pass) failures++;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
};
const r2 = (n: number) => Math.round(n * 100) / 100;

// Wednesday 2026-09-09, 16:00–18:00 local (Sydney) → fully inside peak (weekday 15–21)
const wedPeak = splitPeak(localToUtc(2026, 9, 9, 16), localToUtc(2026, 9, 9, 18), 2);
ok("weekday 4–6pm is all peak", [r2(wedPeak.peakKwh), r2(wedPeak.offPeakKwh)], [2, 0]);

// Wednesday 06:00–08:00 local → all off-peak
const wedOff = splitPeak(localToUtc(2026, 9, 9, 6), localToUtc(2026, 9, 9, 8), 2);
ok("weekday early morning is off-peak", [r2(wedOff.peakKwh), r2(wedOff.offPeakKwh)], [0, 2]);

// Saturday 16:00–18:00 local → weekend, all off-peak
const sat = splitPeak(localToUtc(2026, 9, 12, 16), localToUtc(2026, 9, 12, 18), 2);
ok("weekend afternoon is off-peak", [r2(sat.peakKwh), r2(sat.offPeakKwh)], [0, 2]);

// Straddling the 9pm boundary: 20:00–22:00 → half peak
const edge = splitPeak(localToUtc(2026, 9, 9, 20), localToUtc(2026, 9, 9, 22), 2);
ok("straddling 9pm splits evenly", [r2(edge.peakKwh), r2(edge.offPeakKwh)], [1, 1]);

const rows = [
  { kwh: 10, peakKwh: 4, offPeakKwh: 6 },
  { kwh: 90, peakKwh: 30, offPeakKwh: 60 },
];
ok("flat", costForRows(rows, { tariffType: "flat", rate: 0.3 })!.map(r2), [3, 27]);
ok("time of use", costForRows(rows, { tariffType: "time_of_use", peakRate: 0.45, offPeakRate: 0.2 })!.map(r2), [3, 25.5]);
// tiered: 100 kWh total, 60 @0.25 + 40 @0.35 = 15+14 = 29 → blended 0.29
ok("tiered blended", costForRows(rows, { tariffType: "tiered", tier1Rate: 0.25, tier1UpToKwh: 60, tier2Rate: 0.35 })!.map(r2), [2.9, 26.1]);
ok("no tariff means no cost", costForRows(rows, null), null);

// Unknown bucket is always a row, even with no unknown events
const b = buildBreakdown("2026-09", [
  { id: "1", applianceId: "a", applianceName: "Kettle", startedAt: localToUtc(2026, 9, 9, 7).toISOString(), endedAt: localToUtc(2026, 9, 9, 8).toISOString(), energyKwh: 2, confidence: 0.9 },
], { tariffType: "flat", rate: 0.5 });
ok("unknown row always present", b.items.map((i) => i.appliance), ["Kettle", "Unknown / Other"]);
ok("unknown row is last with no confidence", [b.items[1].applianceId, b.items[1].confidence, b.items[1].kwh], [null, null, 0]);
ok("percent and cost", [b.items[0].percent, b.items[0].cost, b.totalKwh], [100, 1, 2]);
ok("confidence is a word", b.items[0].confidence, "high");

const mr = monthRange("2026-09")!;
ok("month range is local-midnight UTC instants", [mr.from.toISOString(), mr.to.toISOString()], ["2026-08-31T14:00:00.000Z", "2026-09-30T14:00:00.000Z"]);
ok("bad month rejected", monthRange("2026-13"), null);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall cost checks passed");
