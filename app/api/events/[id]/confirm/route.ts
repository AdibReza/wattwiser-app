import { NextResponse } from "next/server";
import { notFound, parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { confirmEvent } from "@/lib/db/queries/events";
import { confirmEventSchema, issuesToFieldErrors } from "@/lib/validation/confirmation";

export const dynamic = "force-dynamic";

/** POST /api/events/:id/confirm { answer, applianceId? } → 201. One answer per event. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  const { data, response } = await parseBody(request, confirmEventSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    const result = await confirmEvent(householdId, id, data.answer, data.applianceId ?? null);
    if (result.status === "not-found") return notFound("Event");
    if (result.status === "already-answered") {
      return NextResponse.json({ error: "That run has already been answered." }, { status: 409 });
    }
    return NextResponse.json({ eventId: id, answer: data.answer }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}
