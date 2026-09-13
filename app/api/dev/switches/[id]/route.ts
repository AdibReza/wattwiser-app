import { NextResponse } from "next/server";
import { z } from "zod";
import { notFound, parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { setMockSwitch } from "@/lib/db/queries/readings";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ isOn: z.boolean({ error: "isOn must be true or false" }) }).strict();

/** PATCH /api/dev/switches/:id { isOn } → the updated switch. Demo only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  const { data, response } = await parseBody(request, bodySchema, (issues) => ({ isOn: issues[0]?.message ?? "Invalid" }));
  if (response) return response;
  try {
    const updated = await setMockSwitch(householdId, id, data.isOn);
    return updated ? NextResponse.json(updated) : notFound("Switch");
  } catch (err) {
    return serverError(err);
  }
}
