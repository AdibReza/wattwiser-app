import type { ApplianceClass } from "@/lib/validation/appliance";

/**
 * Wizard wording by appliance class — docs/specs/screens.md §5.
 * Three variants, not one. `{name}` is the appliance's own name.
 */
export type StepCopy = { title: string; help?: string; note?: string; button: string };

export function stepCopy(step: 1 | 2 | 3 | 4 | 5, cls: ApplianceClass, name: string): StepCopy {
  switch (step) {
    case 1:
      return {
        title: `Make sure ${name} is off.`,
        help: "WattWiser needs a few quiet seconds to learn what your home draws without it.",
        note:
          cls === "variable_load"
            ? "This type of appliance changes its power while running, so it is harder to identify. Plan on a few extra runs."
            : undefined,
        button: "I'm ready",
      };
    case 2:
      return {
        title:
          cls === "multi_stage"
            ? "Start a normal cycle now — the one you use most often."
            : cls === "variable_load"
              ? `Turn ${name} on and set it as you normally would.`
              : `Turn ${name} on as you normally would.`,
        help: "Avoid switching on other appliances for the next 2 minutes.",
        button: "It's on",
      };
    case 3:
      return {
        title: "Recording…",
        help: "Leave it running. Avoid switching on other appliances.",
        note: cls === "multi_stage" ? "A full cycle may take 45–70 minutes. You can leave this page open." : undefined,
        button: "It's finished",
      };
    case 4:
      return {
        title:
          cls === "multi_stage"
            ? "Leave it running to the end of the cycle, then press Done."
            : "Wait for it to finish, then switch it off.",
        note: cls === "multi_stage" ? "This may take 45–70 minutes." : undefined,
        button: "Done",
      };
    case 5:
      return {
        title: "Complete",
        help: "Run calibration again? Three to five runs gives the best result.",
        button: "Yes, run again",
      };
  }
}
