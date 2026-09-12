import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api";
import { buildBreakdown } from "@/lib/breakdown";
import { eventsInRange, monthsWithEvents } from "@/lib/db/queries/breakdown";
import { getHousehold } from "@/lib/db/queries/household";
import { monthRange, tariffLabel } from "@/lib/tariff";

export const dynamic = "force-dynamic";

/**
 * GET /api/breakdown?month=2026-09 → per-appliance aggregation + cost.
 * Computed on request from `events`; nothing stores the aggregate.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const range = monthRange(month);
  if (!range) return badRequest("month must look like 2026-09.");
  try {
    const [household, evts, months] = await Promise.all([getHousehold(), eventsInRange(range.from, range.to), monthsWithEvents()]);
    const tariff = household?.tariff ?? null;
    return NextResponse.json(
      { ...buildBreakdown(month, evts, tariff), tariffLabel: tariffLabel(tariff), availableMonths: months },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return serverError(err);
  }
}
