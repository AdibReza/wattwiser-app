import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";

const { events, appliances } = schema;

export type MonthEvent = {
  id: string;
  applianceId: string | null;
  applianceName: string | null;
  startedAt: string;
  endedAt: string | null;
  energyKwh: number;
  confidence: number | null;
};

/** Every detected run that STARTED inside the month. Rows with a null appliance are the Unknown bucket. */
export async function eventsInRange(from: Date, to: Date): Promise<MonthEvent[]> {
  const rows = await getDb()
    .select({
      id: events.id,
      applianceId: events.applianceId,
      applianceName: appliances.name,
      startedAt: events.startedAt,
      endedAt: events.endedAt,
      energyKwh: events.energyKwh,
      confidence: events.confidence,
    })
    .from(events)
    .leftJoin(appliances, eq(appliances.id, events.applianceId))
    .where(and(gte(events.startedAt, from.toISOString()), lt(events.startedAt, to.toISOString())))
    .orderBy(desc(events.startedAt));

  return rows.map((r) => ({
    id: r.id,
    applianceId: r.applianceId,
    applianceName: r.applianceName,
    startedAt: toIso(r.startedAt)!,
    endedAt: toIso(r.endedAt),
    energyKwh: Number(r.energyKwh ?? 0),
    confidence: r.confidence == null ? null : Number(r.confidence),
  }));
}

/** Months that actually have events, newest first, as "YYYY-MM" in UTC terms (close enough to pick from). */
export async function monthsWithEvents(): Promise<string[]> {
  const rows = await getDb().execute<{ month: string }>(sql`
    select distinct to_char(${events.startedAt}, 'YYYY-MM') as month from ${events} order by month desc limit 24
  `);
  return rows.map((r) => r.month);
}

/** Count of detected runs with no confirmation answer yet — the /confirm queue. */
export async function unconfirmedCount(): Promise<number> {
  const [row] = await getDb().execute<{ n: number }>(sql`
    select count(*)::int as n from ${events} e
    where e.confidence is not null and e.confidence < 0.5
      and not exists (select 1 from event_confirmations c where c.event_id = e.id)
  `);
  return Number(row?.n ?? 0);
}

export { isNull };
