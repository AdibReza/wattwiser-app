import { NextResponse } from "next/server";
import { notFound, requireApiHousehold, serverError } from "@/lib/api";
import { getAppliance, listCalibrations } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

/** GET /api/appliances/:id/calibrations → runs, newest first */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  try {
    if (!(await getAppliance(householdId, id))) return notFound("Appliance");
    return NextResponse.json(await listCalibrations(householdId, id));
  } catch (err) {
    return serverError(err);
  }
}
