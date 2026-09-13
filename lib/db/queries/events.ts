import { and, asc, desc, eq, gte, isNotNull, lt, lte, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";
import type { Answer, PendingEvent } from "@/lib/validation/confirmation";

const { events, appliances, eventConfirmations } = schema;

/** A guess is worth asking about below this confidence. Stored 0.0–1.0, never shown as a decimal. */
export const NEEDS_CONFIRMATION_BELOW = 0.5;

// Correlated on events.id, and every query using it already filters events by
// household, so it can only ever see this household's answers. No filter needed.
const noAnswerYet = sql`not exists (select 1 from ${eventConfirmations} c where c.event_id = ${events.id})`;

/**
 * The queue: runs WattWiser matched to an appliance but is not sure about,
 * that nobody has answered yet. Newest first — recent runs are easier to recall.
 * Unmatched runs (appliance_id is null) are deliberately not asked about.
 */
export async function pendingConfirmations(householdId: string, limit = 25): Promise<PendingEvent[]> {
  const rows = await getDb()
    .select({
      id: events.id,
      applianceId: events.applianceId,
      applianceName: appliances.name,
      startedAt: events.startedAt,
      endedAt: events.endedAt,
      deltaOnW: events.deltaOnW,
      peakWatts: events.peakWatts,
      energyKwh: events.energyKwh,
    })
    .from(events)
    .innerJoin(appliances, eq(appliances.id, events.applianceId))
    .where(
      and(
        eq(events.householdId, householdId),
        isNotNull(events.confidence),
        lt(events.confidence, String(NEEDS_CONFIRMATION_BELOW)),
        noAnswerYet
      )
    )
    .orderBy(desc(events.startedAt))
    .limit(limit);

  return rows.map((r) => {
    const started = new Date(r.startedAt).getTime();
    const ended = r.endedAt ? new Date(r.endedAt).getTime() : null;
    const watts = r.deltaOnW ?? r.peakWatts;
    return {
      id: r.id,
      applianceId: r.applianceId!,
      applianceName: r.applianceName,
      startedAt: toIso(r.startedAt)!,
      endedAt: toIso(r.endedAt),
      watts: watts == null ? null : Number(watts),
      energyKwh: Number(r.energyKwh ?? 0),
      durationS: ended == null ? null : Math.round((ended - started) / 1000),
    };
  });
}

/** How many questions are waiting. Drives the dashboard prompt. */
export async function pendingCount(householdId: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(events)
    .where(
      and(
        eq(events.householdId, householdId),
        isNotNull(events.applianceId),
        isNotNull(events.confidence),
        lt(events.confidence, String(NEEDS_CONFIRMATION_BELOW)),
        noAnswerYet
      )
    );
  return Number(row?.n ?? 0);
}

export type ConfirmResult = { status: "created" } | { status: "not-found" } | { status: "already-answered" };

/** One answer per event. Answering twice is refused rather than silently overwritten. */
export async function confirmEvent(
  householdId: string,
  eventId: string,
  answer: Answer,
  applianceId: string | null
): Promise<ConfirmResult> {
  const db = getDb();
  // Another household's event is "not-found", which the handler turns into a 404.
  const [event] = await db
    .select({ id: events.id, applianceId: events.applianceId })
    .from(events)
    .where(and(eq(events.householdId, householdId), eq(events.id, eventId)))
    .limit(1);
  if (!event) return { status: "not-found" };

  const [existing] = await db.select({ id: eventConfirmations.id }).from(eventConfirmations).where(eq(eventConfirmations.eventId, eventId)).limit(1);
  if (existing) return { status: "already-answered" };

  // "Yes" means the guess was right, so the confirmed appliance is the guessed one.
  let confirmed = answer === "yes" ? event.applianceId : answer === "other" ? applianceId : null;
  // "other" names an appliance from the request body — check it is actually ours
  // before writing it, or one household could point at another's appliance.
  if (answer === "other" && confirmed) {
    const [owned] = await db
      .select({ id: appliances.id })
      .from(appliances)
      .where(and(eq(appliances.householdId, householdId), eq(appliances.id, confirmed)))
      .limit(1);
    if (!owned) return { status: "not-found" };
    confirmed = owned.id;
  }
  await db.insert(eventConfirmations).values({ householdId, eventId, confirmedApplianceId: confirmed, answer });
  return { status: "created" };
}

/** GET /api/events?from=&to= — the documented contract route. */
export async function eventsBetween(householdId: string, from: Date, to: Date, limit = 200) {
  const rows = await getDb()
    .select({
      id: events.id,
      applianceId: events.applianceId,
      applianceName: appliances.name,
      startedAt: events.startedAt,
      endedAt: events.endedAt,
      peakWatts: events.peakWatts,
      deltaOnW: events.deltaOnW,
      energyKwh: events.energyKwh,
      confidence: events.confidence,
      method: events.method,
    })
    .from(events)
    .leftJoin(appliances, eq(appliances.id, events.applianceId))
    .where(
      and(
        eq(events.householdId, householdId),
        gte(events.startedAt, from.toISOString()),
        lte(events.startedAt, to.toISOString())
      )
    )
    .orderBy(asc(events.startedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    applianceId: r.applianceId,
    appliance: r.applianceName ?? null,
    startedAt: toIso(r.startedAt)!,
    endedAt: toIso(r.endedAt),
    peakWatts: r.peakWatts == null ? null : Number(r.peakWatts),
    deltaOnW: r.deltaOnW == null ? null : Number(r.deltaOnW),
    energyKwh: Number(r.energyKwh ?? 0),
    confidence: r.confidence == null ? null : Number(r.confidence),
    method: r.method,
  }));
}
