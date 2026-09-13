import { NextResponse } from "next/server";
import { notFound, parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { startSession } from "@/lib/db/queries/calibration";
import { issuesToFieldErrors, startCalibrationSchema } from "@/lib/validation/calibration";

export const dynamic = "force-dynamic";

/** POST /api/calibration/start { applianceId, baselineW } → 201 { sessionId, startedAt, ...session } */
export async function POST(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { data, response } = await parseBody(request, startCalibrationSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    // An appliance in another household is not found here, so cross-tenant
    // calibration returns 404 without a separate check.
    const session = await startSession(householdId, data.applianceId, data.baselineW);
    if (!session) return notFound("Appliance");
    return NextResponse.json({ sessionId: session.id, ...session }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
