import type { TariffConfig } from "@/lib/validation/household";

/**
 * Turning kWh into dollars — docs/specs/screens.md §6.
 *
 * MVP assumptions, documented because the setup form does not collect them:
 *  - The household lives in HOUSEHOLD_TIMEZONE. Every stored timestamp is UTC;
 *    only this file and the display layer convert.
 *  - Time-of-use peak is weekdays 3pm–9pm local. Everything else is off-peak.
 *  - Tiered prices apply to the whole household's monthly total, so each
 *    appliance is charged the month's blended rate.
 */
export const HOUSEHOLD_TIMEZONE = "Australia/Sydney";
export const PEAK_START_H = 15;
export const PEAK_END_H = 21;
export const PEAK_WINDOW_LABEL = "weekdays 3pm–9pm";

/** How many milliseconds the zone is ahead of UTC at that instant. */
function zoneOffsetMs(date: Date, timeZone = HOUSEHOLD_TIMEZONE): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

/** The UTC instant of a local wall-clock time. */
export function localToUtc(
  year: number,
  month1: number,
  day: number,
  hour = 0,
  timeZone = HOUSEHOLD_TIMEZONE
): Date {
  const guess = Date.UTC(year, month1 - 1, day, hour);
  const once = guess - zoneOffsetMs(new Date(guess), timeZone);
  return new Date(guess - zoneOffsetMs(new Date(once), timeZone));
}

/** "2026-09" → the UTC instants of local month start and the start of the next month. */
export function monthRange(month: string, timeZone = HOUSEHOLD_TIMEZONE): { from: Date; to: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const mon = Number(m[2]);
  if (mon < 1 || mon > 12) return null;
  const from = localToUtc(year, mon, 1, 0, timeZone);
  const to = mon === 12 ? localToUtc(year + 1, 1, 1, 0, timeZone) : localToUtc(year, mon + 1, 1, 0, timeZone);
  return { from, to };
}

function localHourAndDay(date: Date, timeZone = HOUSEHOLD_TIMEZONE): { hour: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour12: false, hour: "2-digit", weekday: "short" })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { hour: Number(parts.hour) % 24, weekday: Math.max(0, days.indexOf(parts.weekday)) };
}

const isPeak = (date: Date, timeZone?: string) => {
  const { hour, weekday } = localHourAndDay(date, timeZone);
  return weekday >= 1 && weekday <= 5 && hour >= PEAK_START_H && hour < PEAK_END_H;
};

/**
 * Split one run's energy into peak and off-peak by walking it in 5-minute
 * slices. Runs are minutes to hours long, so this is cheap and exact enough.
 */
export function splitPeak(
  startedAt: Date,
  endedAt: Date,
  kwh: number,
  timeZone = HOUSEHOLD_TIMEZONE
): { peakKwh: number; offPeakKwh: number } {
  const totalMs = Math.max(1, endedAt.getTime() - startedAt.getTime());
  const stepMs = 5 * 60 * 1000;
  let peakMs = 0;
  for (let t = startedAt.getTime(); t < endedAt.getTime(); t += stepMs) {
    const sliceMs = Math.min(stepMs, endedAt.getTime() - t);
    if (isPeak(new Date(t), timeZone)) peakMs += sliceMs;
  }
  const peakKwh = (kwh * peakMs) / totalMs;
  return { peakKwh, offPeakKwh: kwh - peakKwh };
}

/** What a whole month of consumption costs under a tiered tariff. */
function tieredCost(totalKwh: number, tier1Rate: number, tier1UpToKwh: number, tier2Rate: number): number {
  const tier1 = Math.min(totalKwh, tier1UpToKwh);
  return tier1 * tier1Rate + Math.max(0, totalKwh - tier1UpToKwh) * tier2Rate;
}

export type CostInput = { kwh: number; peakKwh: number; offPeakKwh: number };

/**
 * Cost per row, under the household's tariff. `null` tariff (setup not done)
 * means no cost can be shown — the screen says so rather than inventing a rate.
 */
export function costForRows(rows: CostInput[], tariff: TariffConfig | null): number[] | null {
  if (!tariff) return null;
  switch (tariff.tariffType) {
    case "flat":
      return rows.map((r) => r.kwh * tariff.rate);
    case "time_of_use":
      return rows.map((r) => r.peakKwh * tariff.peakRate + r.offPeakKwh * tariff.offPeakRate);
    case "tiered": {
      const total = rows.reduce((s, r) => s + r.kwh, 0);
      if (total <= 0) return rows.map(() => 0);
      const blended = tieredCost(total, tariff.tier1Rate, tariff.tier1UpToKwh, tariff.tier2Rate) / total;
      return rows.map((r) => r.kwh * blended);
    }
  }
}

export function tariffLabel(tariff: TariffConfig | null): string {
  if (!tariff) return "No tariff set";
  switch (tariff.tariffType) {
    case "flat":
      return `Flat rate, $${tariff.rate.toFixed(2)}/kWh`;
    case "time_of_use":
      return `Time of use, $${tariff.peakRate.toFixed(2)} peak (${PEAK_WINDOW_LABEL}) / $${tariff.offPeakRate.toFixed(2)} off-peak`;
    case "tiered":
      return `Tiered, $${tariff.tier1Rate.toFixed(2)}/kWh to ${tariff.tier1UpToKwh} kWh then $${tariff.tier2Rate.toFixed(2)}`;
  }
}
