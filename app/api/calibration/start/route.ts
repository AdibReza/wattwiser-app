import { NextResponse } from "next/server";
import { notFound, parseBody, serverError } from "@/lib/api";
import { startSession } from "@/lib/db/queries/calibration";
import { issuesToFieldErrors, startCalibrationSchema } from "@/lib/validation/calibration";

export const dynamic = "force-dynamic";

/** POST /api/calibration/start { applianceId, baselineW } → 201 { sessionId, startedAt, ...session } */
export async function POST(request: Request) {
  const { data, response } = await parseBody(request, startCalibrationSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    const session = await startSession(data.applianceId, data.baselineW);
    if (!session) return notFound("Appliance");
    return NextResponse.json({ sessionId: session.id, ...session }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
