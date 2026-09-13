import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { toIso } from "@/lib/db/util";
import type { Household, HouseholdInput, TariffConfig } from "@/lib/validation/household";

type Row = typeof schema.household.$inferSelect;

function rowToHousehold(r: Row): Household {
  const rates = (r.tariffConfig ?? {}) as Record<string, unknown>;
  return {
    id: r.id,
    label: r.label ?? "",
    occupants: r.occupants ?? 1,
    homeType: (r.homeType ?? "house") as Household["homeType"],
    hotWater: (r.hotWater ?? "unknown") as Household["hotWater"],
    heating: (r.heating ?? "none") as Household["heating"],
    cooling: (r.cooling ?? "none") as Household["cooling"],
    hasSolar: r.hasSolar ?? false,
    hasBattery: r.hasBattery ?? false,
    hasEv: r.hasEv ?? false,
    tariff: { tariffType: (r.tariffType ?? "flat") as TariffConfig["tariffType"], ...rates } as TariffConfig,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

/**
 * This household's profile, or null before the setup form has ever been saved.
 *
 * The row itself now exists from the moment the account is created, so "has the
 * profile been filled in?" can no longer be "does a row exist?". `label` is the
 * sentinel: householdInputSchema requires a non-empty label, so a null label
 * means the form has never been submitted. Five screens read `null` here as
 * "Finish setting up your home" and still do.
 */
export async function getHousehold(householdId: string): Promise<Household | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.household).where(eq(schema.household.id, householdId)).limit(1);
  if (!row || row.label === null) return null;
  return rowToHousehold(row);
}

/** The setup form's save. The row always exists by now, so this is a plain update. */
export async function upsertHousehold(householdId: string, input: HouseholdInput): Promise<Household> {
  const db = getDb();
  const { tariff, ...rest } = input;
  const { tariffType, ...tariffConfig } = tariff;

  const [row] = await db
    .update(schema.household)
    .set({ ...rest, tariffType, tariffConfig, updatedAt: sql`now()` })
    .where(eq(schema.household.id, householdId))
    .returning();

  // The guard in lib/api.ts guarantees the row exists, so this only fires if it
  // vanished underneath us — in practice, a `just db-reset` against a running dev
  // server. Say so, instead of letting rowToHousehold throw on undefined and
  // surfacing as an unexplained 500.
  if (!row) throw new Error("That home no longer exists. Sign out and back in.");

  return rowToHousehold(row);
}

/** The household this account owns, or null if the signup hook has not run yet. */
export async function householdIdForUser(userId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ id: schema.household.id })
    .from(schema.household)
    .where(eq(schema.household.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Give an account its household. Called once, from the Better Auth signup hook.
 *
 * The very first account adopts the household left over from before there was
 * any authentication, so the existing demo data keeps an owner instead of being
 * stranded. Everybody after that gets a fresh, empty one.
 *
 * `for update skip locked` is what makes two simultaneous signups safe: the
 * second transaction cannot see the row the first has locked, so it skips
 * straight to the insert rather than waiting and then claiming the same row.
 * The unique constraint on user_id is the backstop if that ever fails.
 */
export async function claimOrCreateHousehold(userId: string): Promise<string> {
  const db = getDb();

  const claimed = await db.execute<{ id: string }>(sql`
    update "household"
       set "user_id" = ${userId}, "updated_at" = now()
     where "id" = (
       select "id" from "household"
        where "user_id" is null
        order by "created_at"
          for update skip locked
        limit 1
     )
    returning "id"
  `);
  if (claimed[0]?.id) return claimed[0].id;

  const [row] = await db.insert(schema.household).values({ userId }).returning({ id: schema.household.id });
  return row.id;
}

/** Has this household loaded the demo dataset, and when. Drives the /dev control. */
export async function demoLoadedAt(householdId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ at: schema.household.demoLoadedAt })
    .from(schema.household)
    .where(eq(schema.household.id, householdId))
    .limit(1);
  return toIso(row?.at ?? null);
}
