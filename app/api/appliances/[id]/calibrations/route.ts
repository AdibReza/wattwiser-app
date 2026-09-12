import { NextResponse } from "next/server";
import { notFound, serverError } from "@/lib/api";
import { getAppliance, listCalibrations } from "@/lib/db/queries/appliances";

export const dynamic = "force-dynamic";

/** GET /api/appliances/:id/calibrations → runs, newest first */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!(await getAppliance(id))) return notFound("Appliance");
    return NextResponse.json(await listCalibrations(id));
  } catch (err) {
    return serverError(err);
  }
}
