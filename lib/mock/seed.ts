/**
 * The `pnpm db:seed` command line — docs/specs/mock-data.md.
 *
 *   pnpm db:seed                    load the demo data (skips if already there)
 *   pnpm db:seed --reset            remove it, then load it again
 *   pnpm db:seed --clear            remove it only
 *   pnpm db:seed --household <uuid> target one household explicitly
 *
 * With no --household it picks the oldest household row, creating an unowned one
 * if the database is empty — the first account to sign up then claims it, which
 * is how a fresh local database gets a demo to look at.
 *
 * The work itself lives in lib/mock/demo-data.ts, shared with the "Load demo
 * data" button on /dev. Runs against the local Supabase only; lib/db/target.ts
 * refuses anything else.
 */
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { demoLoadedAt } from "@/lib/db/queries/household";
import { clearHouseholdDemo, seedHousehold } from "@/lib/mock/demo-data";

try {
  process.loadEnvFile(".env.local");
} catch {
  /* DATABASE_URL already in the environment */
}

const args = process.argv.slice(2);
const has = (flag: string) => args.includes(flag);
const RESET = has("--reset");
const CLEAR = has("--clear");
const EXPLICIT = args[args.indexOf("--household") + 1];

async function targetHousehold(): Promise<string> {
  const db = getDb();

  if (args.includes("--household")) {
    if (!EXPLICIT) throw new Error("--household needs a uuid.");
    const [row] = await db.select({ id: schema.household.id }).from(schema.household).where(eq(schema.household.id, EXPLICIT)).limit(1);
    if (!row) throw new Error(`No household with id ${EXPLICIT}.`);
    return row.id;
  }

  const [first] = await db.select({ id: schema.household.id }).from(schema.household).orderBy(asc(schema.household.createdAt)).limit(1);
  if (first) return first.id;

  // Empty database: make an unowned household for the demo to live in. The first
  // account to sign up adopts it (claimOrCreateHousehold).
  const [created] = await db
    .insert(schema.household)
    .values({
      label: "12 Smith St",
      occupants: 3,
      homeType: "house",
      hotWater: "electric",
      heating: "reverse_cycle_ac",
      cooling: "split_ac",
      hasSolar: true,
      hasBattery: false,
      hasEv: false,
      tariffType: "time_of_use",
      tariffConfig: { peakRate: 0.45, offPeakRate: 0.22 },
    })
    .returning({ id: schema.household.id });
  console.log("household: created one for the demo (unclaimed until someone signs up)");
  return created.id;
}

async function main() {
  const householdId = await targetHousehold();
  console.log(`household: ${householdId}`);

  if (CLEAR || RESET) {
    const { readings } = await clearHouseholdDemo(householdId);
    console.log(`cleared demo rows (readings removed: ${readings})`);
  }
  if (CLEAR) return;

  // Same source of truth as the /dev button: the household's own column.
  if (await demoLoadedAt(householdId)) {
    console.log("demo data already present — run with --reset to replace it");
    return;
  }

  await seedHousehold(householdId, { log: (line) => console.log(line) });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    // drizzle's message is just the failed SQL; the reason (e.g. a foreign-key violation) is on the cause.
    console.error(err instanceof Error ? err.message : err);
    if (err instanceof Error && err.cause) console.error(err.cause);
    process.exit(1);
  });
