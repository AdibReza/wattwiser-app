import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { getMockSwitches } from "@/lib/db/queries/readings";

export const dynamic = "force-dynamic";

/** GET /api/dev/switches → simulated appliances and whether each is on. Demo only. */
export async function GET() {
  try {
    return NextResponse.json(await getMockSwitches());
  } catch (err) {
    return serverError(err);
  }
}
