--> HAND-EDITED after drizzle-kit generate. Two things the generator cannot do:
-->   1. drop the old single-column primary key on mock_switches
-->   2. backfill household_id on the rows that already exist
--> Every statement is safe to run against an empty database (a fresh `just db-reset`)
--> and against the live database that already holds the pre-auth demo data.

DROP INDEX IF EXISTS "events_started_at_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "readings_ts_idx";--> statement-breakpoint

--> Columns first, all nullable. NOT NULL is migration 0005, after this one has
--> been deployed and the backfill below has been eyeballed in Supabase Studio.
ALTER TABLE "household" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "household" ADD COLUMN "demo_loaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "appliance_signatures" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "appliances" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "calibration_sessions" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "devices" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "event_confirmations" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "readings" ADD COLUMN "household_id" uuid;--> statement-breakpoint
ALTER TABLE "mock_switches" ADD COLUMN "household_id" uuid;--> statement-breakpoint

--> BACKFILL. Before auth there was exactly one household, so every orphan row
--> belongs to it. On an empty database the sub-select is NULL, no row matches
--> `household_id is null` because there are no rows, and nothing happens.
UPDATE "appliances"            SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "devices"               SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "calibration_sessions"  SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "appliance_signatures"  SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "events"                SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "event_confirmations"   SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "readings"              SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint
UPDATE "mock_switches"         SET "household_id" = (SELECT "id" FROM "household" ORDER BY "created_at" LIMIT 1) WHERE "household_id" IS NULL;--> statement-breakpoint

--> mock_switches is the one table that must be locked down now, because its
--> primary key changes shape. Any row still unassigned had no household to
--> belong to; getMockSwitches() recreates the four defaults on demand, so
--> dropping them loses nothing.
DELETE FROM "mock_switches" WHERE "household_id" IS NULL;--> statement-breakpoint
ALTER TABLE "mock_switches" DROP CONSTRAINT IF EXISTS "mock_switches_pkey";--> statement-breakpoint
ALTER TABLE "mock_switches" ALTER COLUMN "household_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mock_switches" ADD CONSTRAINT "mock_switches_household_id_id_pk" PRIMARY KEY("household_id","id");--> statement-breakpoint

--> Foreign keys
ALTER TABLE "household" ADD CONSTRAINT "household_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appliance_signatures" ADD CONSTRAINT "appliance_signatures_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appliances" ADD CONSTRAINT "appliances_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_confirmations" ADD CONSTRAINT "event_confirmations_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mock_switches" ADD CONSTRAINT "mock_switches_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "readings" ADD CONSTRAINT "readings_household_id_household_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

--> Indexes
CREATE INDEX "appliance_signatures_appliance_idx" ON "appliance_signatures" USING btree ("appliance_id");--> statement-breakpoint
CREATE INDEX "appliances_household_idx" ON "appliances" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "calibration_sessions_household_idx" ON "calibration_sessions" USING btree ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "devices_household_type_idx" ON "devices" USING btree ("household_id","device_type");--> statement-breakpoint
CREATE INDEX "event_confirmations_event_idx" ON "event_confirmations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_household_started_at_idx" ON "events" USING btree ("household_id","started_at");--> statement-breakpoint
CREATE INDEX "readings_household_ts_idx" ON "readings" USING btree ("household_id","ts");--> statement-breakpoint
ALTER TABLE "household" ADD CONSTRAINT "household_user_id_unique" UNIQUE("user_id");
