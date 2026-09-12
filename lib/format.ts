/**
 * Display formatting — see docs/design-system.md "Numbers and words".
 * Every screen formats through these helpers so numbers look the same everywhere.
 * Timestamps are stored and transported in UTC; ONLY these helpers convert to local time.
 */

export type Confidence = "high" | "medium" | "low" | null;

/** 850 -> "850 W", 2200 -> "2.2 kW". Watts are whole numbers; kilowatts get one decimal. */
export function formatWatts(watts: number | null | undefined): string {
  if (watts == null || Number.isNaN(watts)) return "—";
  if (Math.abs(watts) >= 1000) return `${(watts / 1000).toFixed(1)} kW`;
  return `${Math.round(watts)} W`;
}

/** 2.437 -> "2.4 kWh" */
export function formatKwh(kwh: number | null | undefined): string {
  if (kwh == null || Number.isNaN(kwh)) return "—";
  return `${kwh.toFixed(1)} kWh`;
}

/** 12.5 -> "$12.50". Currency symbol is a display decision, not a data one. */
export function formatCost(amount: number | null | undefined, currency = "$"): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${currency}${amount.toFixed(2)}`;
}

/** 30 -> "30%" ; 2.44 -> "2.4%" */
export function formatPercent(percent: number | null | undefined): string {
  if (percent == null || Number.isNaN(percent)) return "—";
  return `${percent >= 10 ? Math.round(percent) : percent.toFixed(1)}%`;
}

/** 0.0–1.0 stored -> High / Medium / Low shown. Never show the decimal. */
export function confidenceFromScore(score: number | null | undefined): Confidence {
  if (score == null) return null;
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

export function confidenceLabel(confidence: Confidence): string {
  switch (confidence) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return "—";
  }
}

/** UTC ISO string -> local date and time for display, e.g. "12 Sep 2026, 7:15 pm" */
export function formatDateTime(utcIso: string | Date | null | undefined): string {
  if (!utcIso) return "—";
  const d = typeof utcIso === "string" ? new Date(utcIso) : utcIso;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** UTC ISO string -> local time only, e.g. "7:15 pm" */
export function formatTime(utcIso: string | Date | null | undefined): string {
  if (!utcIso) return "—";
  const d = typeof utcIso === "string" ? new Date(utcIso) : utcIso;
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(d);
}

/** seconds -> "2 min 10 s" / "45 s" */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}
