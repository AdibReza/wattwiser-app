import { NextResponse } from "next/server";
import { parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { createAppliance, listAppliances } from "@/lib/db/queries/appliances";
import { applianceInputSchema, issuesToFieldErrors } from "@/lib/validation/appliance";

export const dynamic = "force-dynamic";

/** GET /api/appliances → list with calibration status */
export async function GET() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    return NextResponse.json(await listAppliances(householdId));
  } catch (err) {
    return serverError(err);
  }
}

/** POST /api/appliances → 201 with the new appliance */
export async function POST(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { data, response } = await parseBody(request, applianceInputSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    return NextResponse.json(await createAppliance(householdId, data), { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
