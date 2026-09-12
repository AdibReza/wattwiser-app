import { z } from "zod";

/**
 * Household profile — field list from docs/specs/screens.md §1.
 * Values are the contract's snake_case enums (docs/specs/data-contract.md);
 * labels are the plain words the form shows.
 */
export const HOME_TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "townhouse", label: "Townhouse" },
] as const;

export const HOT_WATER = [
  { value: "electric", label: "Electric" },
  { value: "gas", label: "Gas" },
  { value: "solar", label: "Solar" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "unknown", label: "Don't know" },
] as const;

export const HEATING = [
  { value: "electric", label: "Electric" },
  { value: "gas", label: "Gas" },
  { value: "reverse_cycle_ac", label: "Reverse-cycle AC" },
  { value: "none", label: "None" },
] as const;

export const COOLING = [
  { value: "split_ac", label: "Split-system AC" },
  { value: "ducted_ac", label: "Ducted AC" },
  { value: "fans_only", label: "Fans only" },
  { value: "none", label: "None" },
] as const;

export const TARIFF_TYPES = [
  { value: "flat", label: "Flat rate", description: "One price per kWh, all day." },
  { value: "time_of_use", label: "Time of use", description: "Cheaper off-peak, dearer at peak times." },
  { value: "tiered", label: "Tiered", description: "The price steps up after a monthly amount." },
] as const;

const values = <T extends readonly { value: string }[]>(list: T) =>
  list.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const rate = z
  .number({ error: "Enter a rate in $/kWh" })
  .min(0, "A rate can't be negative")
  .max(10, "That rate looks too high");

/** tariff_config JSON — shape depends on tariff_type (documented in data-contract.md) */
export const tariffConfigSchema = z.discriminatedUnion("tariffType", [
  z.object({ tariffType: z.literal("flat"), rate }),
  z.object({ tariffType: z.literal("time_of_use"), peakRate: rate, offPeakRate: rate }),
  z.object({
    tariffType: z.literal("tiered"),
    tier1Rate: rate,
    tier1UpToKwh: z.number({ error: "Enter the monthly kWh where tier 2 starts" }).min(1, "Must be at least 1 kWh"),
    tier2Rate: rate,
  }),
]);

export const householdInputSchema = z
  .object({
    label: z.string().trim().min(1, "Give your home a name").max(80),
    occupants: z.number({ error: "Enter how many people live here" }).int("Whole numbers only").min(1, "At least 1 person").max(20, "At most 20 people"),
    homeType: z.enum(values(HOME_TYPES)),
    hotWater: z.enum(values(HOT_WATER)),
    heating: z.enum(values(HEATING)),
    cooling: z.enum(values(COOLING)),
    hasSolar: z.boolean(),
    hasBattery: z.boolean(),
    hasEv: z.boolean(),
    tariff: tariffConfigSchema,
  })
  .strict();

export type HouseholdInput = z.infer<typeof householdInputSchema>;
export type TariffConfig = z.infer<typeof tariffConfigSchema>;

/** What GET /api/household returns (camelCase, timestamps UTC ISO). */
export type Household = HouseholdInput & {
  id: string;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Turn zod issues into { fieldName: "message" } for inline display. */
export function issuesToFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.filter((p) => typeof p === "string").join(".") || "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
