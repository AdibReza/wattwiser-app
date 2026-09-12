/**
 * Database schema — the published contract in docs/specs/data-contract.md.
 * Column names are snake_case here and become camelCase in route handlers.
 * Every timestamp is `timestamptz` and is written in UTC. No exceptions.
 *
 * Write ownership (only one side writes each table):
 *   web side : household, devices, appliances, calibration_sessions, event_confirmations
 *   data side: appliance_signatures, readings, events   (web side seeds them for this MVP only)
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const utc = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

export const household = pgTable("household", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label"),
  occupants: integer("occupants"),
  homeType: text("home_type"), // house | apartment | townhouse
  hotWater: text("hot_water"), // electric | gas | solar | heat_pump | unknown
  heating: text("heating"), // electric | gas | reverse_cycle_ac | none
  cooling: text("cooling"), // split_ac | ducted_ac | fans_only | none
  hasSolar: boolean("has_solar"),
  hasBattery: boolean("has_battery"),
  hasEv: boolean("has_ev"),
  tariffType: text("tariff_type"), // flat | time_of_use | tiered
  tariffConfig: jsonb("tariff_config"), // rates; shape depends on tariff_type
  createdAt: utc("created_at").defaultNow(),
  updatedAt: utc("updated_at"),
});

export const devices = pgTable("devices", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"), // "Shelly EM Gen3 - main"
  deviceType: text("device_type"),
  lastSeenAt: utc("last_seen_at"), // null or stale = Not Connected
  status: text("status"), // connected | disconnected | unknown
  createdAt: utc("created_at").defaultNow(),
});

export const appliances = pgTable("appliances", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category"), // Kitchen | Laundry | Heating & cooling | Hot water | Entertainment | Other
  applianceClass: text("appliance_class").notNull(), // simple | multi_stage | variable_load
  ratedWatts: integer("rated_watts"), // nameplate; reference only, never the identifier
  brandModel: text("brand_model"),
  commonSettings: text("common_settings"),
  notes: text("notes"),
  createdAt: utc("created_at").defaultNow(),
});

export const calibrationSessions = pgTable(
  "calibration_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "cascade" }),
    startedAt: utc("started_at").notNull(), // when the user confirmed "on"
    endedAt: utc("ended_at"), // null = still running
    status: text("status").notNull(), // running | completed | discarded
    baselineW: numeric("baseline_w"), // total power before switch-on
    createdAt: utc("created_at").defaultNow(),
  },
  (t) => [index("calibration_sessions_appliance_idx").on(t.applianceId)]
);

export const applianceSignatures = pgTable("appliance_signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "cascade" }),
  deltaOnW: numeric("delta_on_w"),
  deltaOffW: numeric("delta_off_w"),
  durationMinS: integer("duration_min_s"),
  durationMaxS: integer("duration_max_s"),
  pattern: jsonb("pattern"), // multi-stage sequence, if any
  sampleCount: integer("sample_count"),
  confidence: text("confidence"), // high | medium | low
  updatedAt: utc("updated_at"),
});

export const readings = pgTable(
  "readings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    ts: utc("ts").notNull(),
    watts: numeric("watts").notNull(),
    volts: numeric("volts"),
    amps: numeric("amps"),
    powerFactor: numeric("power_factor"),
  },
  (t) => [index("readings_ts_idx").on(t.ts)]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "set null" }), // null = Unknown bucket
    startedAt: utc("started_at").notNull(),
    endedAt: utc("ended_at"),
    peakWatts: numeric("peak_watts"),
    deltaOnW: numeric("delta_on_w"),
    energyKwh: numeric("energy_kwh"),
    confidence: numeric("confidence"), // 0.0 – 1.0, shown as High / Medium / Low
    method: text("method"), // e.g. "rule_match"
  },
  (t) => [index("events_started_at_idx").on(t.startedAt)]
);

export const eventConfirmations = pgTable("event_confirmations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  confirmedApplianceId: uuid("confirmed_appliance_id").references(() => appliances.id, { onDelete: "set null" }), // null if "don't know"
  answer: text("answer"), // yes | no | other | unknown
  createdAt: utc("created_at").defaultNow(),
});
