import { NextResponse } from "next/server";
import { parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { getHousehold, upsertHousehold } from "@/lib/db/queries/household";
import { householdInputSchema, issuesToFieldErrors } from "@/lib/validation/household";

export const dynamic = "force-dynamic";

/** GET /api/household → the single household (camelCase) or null before setup. */
export async function GET() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    return NextResponse.json(await getHousehold(householdId));
  } catch (err) {
    return serverError(err);
  }
}

/** PUT /api/household → validate, create-or-update, return the saved household. */
export async function PUT(request: Request) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { data, response } = await parseBody(request, householdInputSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    return NextResponse.json(await upsertHousehold(householdId, data));
  } catch (err) {
    return serverError(err);
  }
}
