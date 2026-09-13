import { NextResponse } from "next/server";
import { badRequest, requireApiHousehold, serverError } from "@/lib/api";
import { getReadingsSource } from "@/lib/readings/source";

export const dynamic = "force-dynamic";

const MAX_RANGE_MS = 24 * 60 * 60 * 1000;

/** GET /api/readings?from=&to= (UTC ISO) → [{ ts, watts }] oldest first. Defaults to the last 60 s. */
export async function GET(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(to.getTime() - 60_000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return badRequest("from and to must be UTC ISO timestamps.");
  if (to <= from) return badRequest("to must be after from.");
  if (to.getTime() - from.getTime() > MAX_RANGE_MS) return badRequest("Ask for at most 24 hours at a time.");
  try {
    return NextResponse.json(await getReadingsSource().range(householdId, from, to), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError(err);
  }
}
