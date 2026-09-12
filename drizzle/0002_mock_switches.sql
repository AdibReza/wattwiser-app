CREATE TABLE "mock_switches" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"watts" integer NOT NULL,
	"is_on" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
