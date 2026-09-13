/**
 * The "Load demo data" control on /dev. Demo data is never loaded automatically —
 * a new account starts empty and the person decides.
 *
 * Writes ~44,000 readings, so it needs more than the default execution budget.
 */
import { NextResponse } from "next/server";
import { notFound, requireApiHousehold, serverError } from "@/lib/api";
import { demoLoadedAt } from "@/lib/db/queries/household";
import { clearHouseholdDemo, seedHousehold } from "@/lib/mock/demo-data";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET → { loaded, loadedAt } so the screen knows which button to show. */
export async function GET() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    const loadedAt = await demoLoadedAt(householdId);
    return NextResponse.json({ loaded: loadedAt !== null, loadedAt });
  } catch (err) {
    return serverError(err);
  }
}

/** POST → load 30 days of demo data. 409 if this household already has it. */
export async function POST() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    // household.demo_loaded_at is the single source of truth, the same column the
    // /dev card reads. Testing for seed-tagged appliances instead would drift:
    // delete the six demo appliances by hand and the readings become unremovable.
    if (await demoLoadedAt(householdId)) {
      return NextResponse.json({ error: "This home already has demo data." }, { status: 409 });
    }
    const result = await seedHousehold(householdId);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

/** DELETE → remove it again. 404 if there was none. */
export async function DELETE() {
  const { householdId, response: authFail } = await requireApiHousehold();
  if (authFail) return authFail;
  try {
    if (!(await demoLoadedAt(householdId))) return notFound("Demo data");
    await clearHouseholdDemo(householdId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return serverError(err);
  }
}
