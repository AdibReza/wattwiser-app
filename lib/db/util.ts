/** Postgres returns "2026-09-12 05:10:41.88+00"; the wire contract is UTC ISO-8601 ("2026-09-12T05:10:41.880Z"). */
export function toIso(pgTimestamp: string | null | undefined): string | null {
  if (!pgTimestamp) return null;
  const d = new Date(pgTimestamp);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
