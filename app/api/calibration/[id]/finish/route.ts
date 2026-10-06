
import { NextResponse } from "next/server";
import {
  notFound,
  requireApiHousehold,
  serverError,
} from "@/lib/api";
import {
  finishSession,
  getSession,
} from "@/lib/db/queries/calibration";
import { analyseAndSaveCalibration } from "@/lib/calibration/analyse-session";

export const dynamic = "force-dynamic";

/** POST /api/calibration/:id/finish */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { householdId, response: authFail } =
    await requireApiHousehold();

  if (authFail) return authFail;

  const { id } = await params;

  try {
    // Retrieve the session before changing its status.
    const existingSession = await getSession(householdId, id);

    if (!existingSession) {
      return notFound("Calibration session");
    }

    // Finish the session.
    const session = await finishSession(householdId, id);

    if (!session) {
      return notFound("Calibration session");
    }

    // Analyse only when this request finishes a running session.
    // This prevents repeated requests from overwriting a newer profile.
    if (existingSession.status !== "running") {
      return NextResponse.json({
        sessionId: session.id,
        endedAt: session.endedAt,
        status: session.status,
        durationS: session.durationS,
        analysis: null,
        message: "This session was already processed or is not running.",
      });
    }

    // Analyse real Shelly readings and save a valid appliance signature.
    const analysis = await analyseAndSaveCalibration(
      householdId,
      session
    );

    return NextResponse.json({
      sessionId: session.id,
      endedAt: session.endedAt,
      status: session.status,
      durationS: session.durationS,
      analysis,
    });
  } catch (err) {
    return serverError(err);
  }
}
