import { NextResponse } from "next/server";
import { requireApiHousehold, serverError } from "@/lib/api";
import { getReadingsSource } from "@/lib/readings/source";

export const dynamic = "force-dynamic";

/** GET /api/readings/current → { watts, ts, deviceConnected } */
export async function GET() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    return NextResponse.json(await getReadingsSource().current(householdId), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError(err);
  }
}
