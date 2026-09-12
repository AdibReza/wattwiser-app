import { NextResponse } from "next/server";
import { serverError } from "@/lib/api";
import { getReadingsSource } from "@/lib/readings/source";

export const dynamic = "force-dynamic";

/** GET /api/readings/current → { watts, ts, deviceConnected } */
export async function GET() {
  try {
    return NextResponse.json(await getReadingsSource().current(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return serverError(err);
  }
}
