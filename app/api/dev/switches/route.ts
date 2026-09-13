import { NextResponse } from "next/server";
import { requireApiHousehold, serverError } from "@/lib/api";
import { getMockSwitches } from "@/lib/db/queries/readings";

export const dynamic = "force-dynamic";

/** GET /api/dev/switches → simulated appliances and whether each is on. Demo only. */
export async function GET() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    return NextResponse.json(await getMockSwitches(householdId));
  } catch (err) {
    return serverError(err);
  }
}
