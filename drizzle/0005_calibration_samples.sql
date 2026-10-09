CREATE TABLE "calibration_samples" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "household_id" uuid,
    "calibration_session_id" uuid,
    "appliance_id" uuid,
    "baseline_w" numeric,
    "delta_on_w" numeric,
    "delta_off_w" numeric,
    "duration_s" numeric,
    "features" jsonb,
    "baseline_trace" jsonb,
    "active_trace" jsonb,
    "off_trace" jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "calibration_samples" ADD CONSTRAINT "calibration_samples_household_id_household_id_fk"
    FOREIGN KEY ("household_id") REFERENCES "public"."household"("id")
    ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "calibration_samples" ADD CONSTRAINT "calibration_samples_calibration_session_id_calibration_sessions_id_fk"
    FOREIGN KEY ("calibration_session_id") REFERENCES "public"."calibration_sessions"("id")
    ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "calibration_samples" ADD CONSTRAINT "calibration_samples_appliance_id_appliances_id_fk"
    FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id")
    ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "calibration_samples_household_idx"
    ON "calibration_samples" USING btree ("household_id");
--> statement-breakpoint
CREATE INDEX "calibration_samples_session_idx"
    ON "calibration_samples" USING btree ("calibration_session_id");
--> statement-breakpoint
CREATE INDEX "calibration_samples_appliance_idx"
    ON "calibration_samples" USING btree ("appliance_id");
