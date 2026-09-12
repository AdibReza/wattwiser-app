import { NextResponse } from "next/server";
import { getHousehold, upsertHousehold } from "@/lib/db/queries/household";
import { householdInputSchema, issuesToFieldErrors } from "@/lib/validation/household";

export const dynamic = "force-dynamic";

/** GET /api/household → the single household (camelCase) or null before setup. */
export async function GET() {
  try {
    return NextResponse.json(await getHousehold());
  } catch (err) {
    return NextResponse.json({ error: message(err) }, { status: 500 });
  }
}

/** PUT /api/household → validate, create-or-update, return the saved household. */
export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be JSON." }, { status: 400 });
  }
  const parsed = householdInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some fields need attention.", fields: issuesToFieldErrors(parsed.error.issues) },
      { status: 400 }
    );
  }
  try {
    return NextResponse.json(await upsertHousehold(parsed.data));
  } catch (err) {
    return NextResponse.json({ error: message(err) }, { status: 500 });
  }
}

function message(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong saving your household.";
}
