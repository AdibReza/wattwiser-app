ALTER TABLE "appliance_signatures" DROP CONSTRAINT "appliance_signatures_appliance_id_appliances_id_fk";
--> statement-breakpoint
ALTER TABLE "calibration_sessions" DROP CONSTRAINT "calibration_sessions_appliance_id_appliances_id_fk";
--> statement-breakpoint
ALTER TABLE "event_confirmations" DROP CONSTRAINT "event_confirmations_confirmed_appliance_id_appliances_id_fk";
--> statement-breakpoint
ALTER TABLE "events" DROP CONSTRAINT "events_appliance_id_appliances_id_fk";
--> statement-breakpoint
ALTER TABLE "appliance_signatures" ADD CONSTRAINT "appliance_signatures_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_sessions" ADD CONSTRAINT "calibration_sessions_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_confirmations" ADD CONSTRAINT "event_confirmations_confirmed_appliance_id_appliances_id_fk" FOREIGN KEY ("confirmed_appliance_id") REFERENCES "public"."appliances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_appliance_id_appliances_id_fk" FOREIGN KEY ("appliance_id") REFERENCES "public"."appliances"("id") ON DELETE set null ON UPDATE no action;