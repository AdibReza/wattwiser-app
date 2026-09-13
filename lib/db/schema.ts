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
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const utc = (name: string) => timestamp(name, { withTimezone: true, mode: "string" });

/* ------------------------------------------------------------------ auth */

/**
 * Better Auth's four tables (lib/auth.ts). Field names on the left of each line
 * must stay exactly as Better Auth names them — the Drizzle adapter looks the
 * columns up by those keys. The SQL column names on the right follow this
 * project's snake_case rule, which the adapter does not care about.
 *
 * These use Drizzle's Date-mode timestamps, not the `utc()` helper above:
 * Better Auth hands the adapter real `Date` objects, and `mode: "string"` would
 * reject them. Storage is still `timestamptz`, still UTC.
 */
const authTs = (name: string) => timestamp(name, { withTimezone: true });

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: authTs("created_at").notNull().defaultNow(),
  updatedAt: authTs("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: authTs("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: authTs("created_at").notNull().defaultNow(),
    updatedAt: authTs("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: authTs("access_token_expires_at"),
    refreshTokenExpiresAt: authTs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"), // bcrypt-style hash for email+password sign-in
    createdAt: authTs("created_at").notNull().defaultNow(),
    updatedAt: authTs("updated_at").notNull().defaultNow(),
  },
  (t) => [index("account_user_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: authTs("expires_at").notNull(),
    createdAt: authTs("created_at").notNull().defaultNow(),
    updatedAt: authTs("updated_at").notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);


export const household = pgTable("household", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * The account that owns this household — one each, enforced by the unique
   * constraint. Nullable only so the pre-auth row survives the migration with
   * no owner; the first account to sign up claims it. See claimOrCreateHousehold().
   */
  userId: text("user_id")
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
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
  /**
   * When this household loaded the 30-day demo dataset, or null if it never did.
   * Drives the Load/Remove demo data control, and gives "remove" the exact
   * reading window to delete instead of recomputing it from the wall clock.
   */
  demoLoadedAt: utc("demo_loaded_at"),
  createdAt: utc("created_at").defaultNow(),
  updatedAt: utc("updated_at"),
});

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    name: text("name"), // "Shelly EM Gen3 - main"
    deviceType: text("device_type"),
    lastSeenAt: utc("last_seen_at"), // null or stale = Not Connected
    status: text("status"), // connected | disconnected | unknown
    createdAt: utc("created_at").defaultNow(),
  },
  // One simulated device per household, so concurrent polls upsert instead of
  // inserting a second row (lib/db/queries/readings.ts touchMockDevice).
  (t) => [uniqueIndex("devices_household_type_idx").on(t.householdId, t.deviceType)]
);

export const appliances = pgTable(
  "appliances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category"), // Kitchen | Laundry | Heating & cooling | Hot water | Entertainment | Other
    applianceClass: text("appliance_class").notNull(), // simple | multi_stage | variable_load
    ratedWatts: integer("rated_watts"), // nameplate; reference only, never the identifier
    brandModel: text("brand_model"),
    commonSettings: text("common_settings"),
    notes: text("notes"),
    createdAt: utc("created_at").defaultNow(),
  },
  (t) => [index("appliances_household_idx").on(t.householdId)]
);

export const calibrationSessions = pgTable(
  "calibration_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "cascade" }),
    startedAt: utc("started_at").notNull(), // when the user confirmed "on"
    endedAt: utc("ended_at"), // null = still running
    status: text("status").notNull(), // running | completed | discarded
    baselineW: numeric("baseline_w"), // total power before switch-on
    createdAt: utc("created_at").defaultNow(),
  },
  (t) => [
    index("calibration_sessions_appliance_idx").on(t.applianceId),
    index("calibration_sessions_household_idx").on(t.householdId),
  ]
);

export const applianceSignatures = pgTable(
  "appliance_signatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "cascade" }),
    deltaOnW: numeric("delta_on_w"),
    deltaOffW: numeric("delta_off_w"),
    durationMinS: integer("duration_min_s"),
    durationMaxS: integer("duration_max_s"),
    pattern: jsonb("pattern"), // multi-stage sequence, if any
    sampleCount: integer("sample_count"),
    confidence: text("confidence"), // high | medium | low
    updatedAt: utc("updated_at"),
  },
  // appliance_id is the only lookup key this table has; it had no index at all.
  (t) => [index("appliance_signatures_appliance_idx").on(t.applianceId)]
);

export const readings = pgTable(
  "readings",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    ts: utc("ts").notNull(),
    watts: numeric("watts").notNull(),
    volts: numeric("volts"),
    amps: numeric("amps"),
    powerFactor: numeric("power_factor"),
  },
  // Every readings query is "this household, this time window" — the composite
  // index is what keeps the table usable once more than one household exists.
  (t) => [index("readings_household_ts_idx").on(t.householdId, t.ts)]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    applianceId: uuid("appliance_id").references(() => appliances.id, { onDelete: "set null" }), // null = Unknown bucket
    startedAt: utc("started_at").notNull(),
    endedAt: utc("ended_at"),
    peakWatts: numeric("peak_watts"),
    deltaOnW: numeric("delta_on_w"),
    energyKwh: numeric("energy_kwh"),
    confidence: numeric("confidence"), // 0.0 – 1.0, shown as High / Medium / Low
    method: text("method"), // e.g. "rule_match"
  },
  (t) => [index("events_household_started_at_idx").on(t.householdId, t.startedAt)]
);

export const eventConfirmations = pgTable(
  "event_confirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Owning household. Every read and write is filtered by this. */
    householdId: uuid("household_id").references(() => household.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id),
    confirmedApplianceId: uuid("confirmed_appliance_id").references(() => appliances.id, { onDelete: "set null" }), // null if "don't know"
    answer: text("answer"), // yes | no | other | unknown
    createdAt: utc("created_at").defaultNow(),
  },
  // Drives the `not exists` in the confirmation queue; it had no index before.
  (t) => [index("event_confirmations_event_idx").on(t.eventId)]
);

/**
 * MVP ONLY — web-side table behind the /dev demo panel. Holds which simulated
 * appliances are switched on so the mock generator (lib/readings/mock.ts) can
 * compute the live power on every request. Dropped when the real pipeline runs.
 */
export const mockSwitches = pgTable(
  "mock_switches",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    id: text("id").notNull(), // kettle | washing_machine | microwave | air_conditioner
    label: text("label").notNull(),
    watts: integer("watts").notNull(),
    isOn: boolean("is_on").notNull().default(false),
    updatedAt: utc("updated_at").defaultNow(),
  },
  // Composite key: every household has its own "kettle".
  (t) => [primaryKey({ columns: [t.householdId, t.id] })]
);
