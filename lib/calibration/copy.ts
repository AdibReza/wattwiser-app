import type { ApplianceClass } from "@/lib/validation/appliance";

/**
 * Wizard wording by appliance class — docs/specs/screens.md §5.
 * Three variants, not one. `{name}` is the appliance's own name.
 * Three steps: switch it off → switch it on → switch it off and save.
 */
export type WizardStep = 1 | 2 | 3;
export type StepCopy = { title: string; help?: string; note?: string; button: string };

/** Shown before the run starts, so nobody is surprised by a 70-minute cycle. */
export function timeEstimate(cls: ApplianceClass): string {
  return cls === "multi_stage" ? "Takes about an hour" : "Takes a few minutes";
}

export function stepCopy(step: WizardStep, cls: ApplianceClass, name: string): StepCopy {
  switch (step) {
    case 1:
      return {
        title: `Switch ${name} off.`,
        help: "Leave everything else as it is. WattWiser is measuring what your home uses without it.",
        button: "Next",
      };
    case 2:
      return {
        title:
          cls === "multi_stage"
            ? "Start a normal cycle now — the one you use most often."
            : cls === "variable_load"
              ? `Switch ${name} on and set it as you normally would.`
              : `Switch ${name} on now.`,
        help: "Then leave it running. Avoid switching other appliances on or off until you're done.",
        note:
          cls === "multi_stage"
            ? "A full cycle takes 45–70 minutes. You can leave this page open."
            : cls === "variable_load"
              ? "Tip: this kind of appliance changes its power while running, so a few extra runs help WattWiser recognise it."
              : undefined,
        button: cls === "multi_stage" ? "The cycle has finished" : `Next`,
      };
    case 3:
      return {
        title: cls === "multi_stage" ? `Make sure ${name} has stopped.` : `Switch ${name} off.`,
        help: "Press Save once it's off, so the recording ends where the appliance does.",
        button: "Save",
      };
  }
}

/** The screen after Save. Not a step — the run is already stored. */
export function doneCopy(name: string) {
  return {
    title: `Saved. WattWiser has learned a little more about ${name}.`,
    help: "Three to five runs gives the best result. You can add more now or any time later.",
  };
}
