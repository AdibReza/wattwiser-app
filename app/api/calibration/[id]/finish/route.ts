import { NextResponse } from "next/server";
import { notFound, requireApiHousehold, serverError } from "@/lib/api";
import { finishSession } from "@/lib/db/queries/calibration";

export const dynamic = "force-dynamic";

/** POST /api/calibration/:id/finish → { sessionId, endedAt, status } */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  try {
    const session = await finishSession(householdId, id);
    if (!session) return notFound("Calibration session");
    return NextResponse.json({ sessionId: session.id, endedAt: session.endedAt, status: session.status, durationS: session.durationS });
  } catch (err) {
    return serverError(err);
  }
}
