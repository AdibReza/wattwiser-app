import { NextResponse } from "next/server";
import { notFound, requireApiHousehold, serverError } from "@/lib/api";
import { getSession } from "@/lib/db/queries/calibration";

export const dynamic = "force-dynamic";

/** GET /api/calibration/:id → session detail + status */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  try {
    const session = await getSession(householdId, id);
    return session ? NextResponse.json(session) : notFound("Calibration session");
  } catch (err) {
    return serverError(err);
  }
}
