import { NextResponse } from "next/server";
import { badRequest, requireApiHousehold, serverError } from "@/lib/api";
import { eventsBetween, pendingConfirmations } from "@/lib/db/queries/events";

export const dynamic = "force-dynamic";

const MAX_RANGE_MS = 92 * 24 * 60 * 60 * 1000;

/**
 * GET /api/events?from=&to=          detected runs in a window (UTC ISO)
 * GET /api/events?needsConfirmation=1 the confirmation queue instead
 */
export async function GET(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("needsConfirmation")) {
    try {
      return NextResponse.json(await pendingConfirmations(householdId));
    } catch (err) {
      return serverError(err);
    }
  }
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(to.getTime() - 7 * 86400_000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return badRequest("from and to must be UTC ISO timestamps.");
  if (to <= from) return badRequest("to must be after from.");
  if (to.getTime() - from.getTime() > MAX_RANGE_MS) return badRequest("Ask for at most 3 months at a time.");
  try {
    return NextResponse.json(await eventsBetween(householdId, from, to));
  } catch (err) {
    return serverError(err);
  }
}
