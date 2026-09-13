import { NextResponse } from "next/server";
import { notFound, parseBody, requireApiHousehold, serverError } from "@/lib/api";
import { deleteAppliance, getAppliance, updateAppliance } from "@/lib/db/queries/appliances";
import { applianceInputSchema, issuesToFieldErrors } from "@/lib/validation/appliance";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  try {
    // Another household's id matches nothing → 404, never 403.
    const appliance = await getAppliance(householdId, id);
    return appliance ? NextResponse.json(appliance) : notFound("Appliance");
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  const { data, response } = await parseBody(request, applianceInputSchema, issuesToFieldErrors);
  if (response) return response;
  try {
    const appliance = await updateAppliance(householdId, id, data);
    return appliance ? NextResponse.json(appliance) : notFound("Appliance");
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  const { id } = await params;
  try {
    return (await deleteAppliance(householdId, id)) ? new NextResponse(null, { status: 204 }) : notFound("Appliance");
  } catch (err) {
    return serverError(err);
  }
}
