CREATE TABLE "appliance_signatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appliance_id" uuid,
	"delta_on_w" numeric,
	"delta_off_w" numeric,
	"duration_min_s" integer,
	"duration_max_s" integer,
	"pattern" jsonb,
	"sample_count" integer,
	"confidence" text,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "appliances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"appliance_class" text NOT NULL,
	"rated_watts" integer,
	"brand_model" text,
	"common_settings" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calibration_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appliance_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"status" text NOT NULL,
	"baseline_w" numeric,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"device_type" text,
	"last_seen_at" timestamp with time zone,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"confirmed_appliance_id" uuid,
	"answer" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appliance_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"peak_watts" numeric,
	"delta_on_w" numeric,
	"energy_kwh" numeric,
	"confidence" numeric,
	"method" text
);
--> statement-breakpoint
CREATE TABLE "household" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text,
	"occupants" integer,
	"home_type" text,
	"hot_water" text,
	"heating" text,
	"cooling" text,
	"has_solar" boolean,
	"has_battery" boolean,
	"has_ev" boolean,
	"tariff_type" text,
	"tariff_config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "readings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone NOT NULL,
	"watts" numeric NOT NULL,
	"volts" numeric,
	"amps" numeric,
	"power_factor" numeric
);
--> statement-breakpoint
ALTER TABLE "appliance_signatures" ADD CONSTRAINT "appliance_signatures_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_confirmations" ADD CONSTRAINT "event_confirmations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_confirmations" ADD CONSTRAINT "event_confirmations_confirmed_appliance_id_appliances_id_fk" FOREIGN KEY ("confirmed_appliance_id") REFERENCES "public"."appliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "calibration_sessions_appliance_idx" ON "calibration_sessions" USING btree ("appliance_id");--> statement-breakpoint
CREATE INDEX "events_started_at_idx" ON "events" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "readings_ts_idx" ON "readings" USING btree ("ts");