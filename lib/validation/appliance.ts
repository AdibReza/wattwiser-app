import { z } from "zod";

/** Appliance inventory — docs/specs/screens.md §3–4, docs/specs/data-contract.md `appliances`. */
export const CATEGORIES = [
  "Kitchen",
  "Laundry",
  "Heating & cooling",
  "Hot water",
  "Entertainment",
  "Other",
] as const;

/** appliance_class drives which wizard copy is shown (three variants). */
export const APPLIANCE_CLASSES = [
  {
    value: "simple",
    label: "Simple",
    description: "Switches on, draws steady power, switches off. Kettle, toaster, heater, lamp.",
  },
  {
    value: "multi_stage",
    label: "Multi-stage",
    description: "Runs a cycle with several phases. Washing machine, dishwasher, dryer, oven.",
  },
  {
    value: "variable_load",
    label: "Variable load",
    description: "Power goes up and down while running. Air conditioner, fridge, EV charger, pool pump.",
  },
] as const;

export type ApplianceClass = (typeof APPLIANCE_CLASSES)[number]["value"];

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s === "" ? null : s))
    .nullable()
    .optional();

export const applianceInputSchema = z
  .object({
    name: z.string({ error: "Give the appliance a name" }).trim().min(1, "Give the appliance a name").max(60),
    category: z.enum(CATEGORIES, { error: "Pick a category" }),
    applianceClass: z.enum(["simple", "multi_stage", "variable_load"], { error: "Pick an appliance type" }),
    ratedWatts: z
      .number({ error: "Enter a whole number of watts" })
      .int("Whole numbers only")
      .min(1, "Must be at least 1 W")
      .max(50000, "That looks too high")
      .nullable()
      .optional(),
    brandModel: optionalText(80),
    commonSettings: optionalText(200),
    notes: optionalText(500),
  })
  .strict();

export type ApplianceInput = z.infer<typeof applianceInputSchema>;

/** GET /api/appliances item (docs/specs/api-routes.md). */
export type ApplianceSummary = {
  id: string;
  name: string;
  category: string | null;
  applianceClass: ApplianceClass;
  ratedWatts: number | null;
  calibrationCount: number;
  isCalibrated: boolean;
};

export type Appliance = ApplianceSummary & {
  brandModel: string | null;
  commonSettings: string | null;
  notes: string | null;
  createdAt: string | null;
};

export type CalibrationSummary = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: "running" | "completed" | "discarded";
  durationS: number | null;
};

export function issuesToFieldErrors(issues: z.ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = i.path.filter((p) => typeof p === "string").join(".") || "form";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}
