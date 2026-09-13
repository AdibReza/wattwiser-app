import { NextResponse } from "next/server";
import { badRequest, requireApiHousehold, serverError } from "@/lib/api";
import { energyKwh } from "@/lib/db/queries/readings";

export const dynamic = "force-dynamic";

const MAX_RANGE_MS = 31 * 24 * 60 * 60 * 1000;

/** GET /api/readings/energy?from=&to= (UTC ISO) → { kwh, from, to }. The browser decides what "today" means. */
export async function GET(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : null;
  if (!from || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return badRequest("from (and optionally to) must be UTC ISO timestamps.");
  if (to <= from) return badRequest("to must be after from.");
  if (to.getTime() - from.getTime() > MAX_RANGE_MS) return badRequest("Ask for at most 31 days at a time.");
  try {
    const kwh = await energyKwh(householdId, from, to);
    return NextResponse.json({ kwh, from: from.toISOString(), to: to.toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError(err);
  }
}
