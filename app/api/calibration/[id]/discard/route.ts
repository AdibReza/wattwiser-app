import { NextResponse } from "next/server";
import { notFound, serverError } from "@/lib/api";
import { discardSession } from "@/lib/db/queries/calibration";

export const dynamic = "force-dynamic";

/** POST /api/calibration/:id/discard → { sessionId, status } */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await discardSession(id);
    if (!session) return notFound("Calibration session");
    return NextResponse.json({ sessionId: session.id, status: session.status, endedAt: session.endedAt });
  } catch (err) {
    return serverError(err);
  }
}
