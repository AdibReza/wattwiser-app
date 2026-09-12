import { sql } from "drizzle-orm";
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

/** The single household row, or null before first setup. */
export async function getHousehold(): Promise<Household | null> {
  const db = getDb();
  const [row] = await db.select().from(schema.household).orderBy(schema.household.createdAt).limit(1);
  return row ? rowToHousehold(row) : null;
}

/** Create the row on first save, update it afterwards. Never more than one row. */
export async function upsertHousehold(input: HouseholdInput): Promise<Household> {
  const db = getDb();
  const { tariff, ...rest } = input;
  const { tariffType, ...tariffConfig } = tariff;
  const values = { ...rest, tariffType, tariffConfig };

  const [existing] = await db.select({ id: schema.household.id }).from(schema.household).limit(1);
  const [row] = existing
    ? await db
        .update(schema.household)
        .set({ ...values, updatedAt: sql`now()` })
        .where(sql`${schema.household.id} = ${existing.id}`)
        .returning()
    : await db.insert(schema.household).values(values).returning();
  return rowToHousehold(row);
}
