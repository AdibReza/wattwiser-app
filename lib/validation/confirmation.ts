import { z } from "zod";

/**
 * Human-in-the-loop answers — docs/specs/screens.md §7.
 * Stored in `event_confirmations`; nothing consumes it in this MVP. It is
 * labelled data the data side can use later, collected while a person is
 * already looking at the screen.
 */
export const ANSWERS = ["yes", "no", "other", "unknown"] as const;
export type Answer = (typeof ANSWERS)[number];

export const confirmEventSchema = z
  .object({
    answer: z.enum(ANSWERS, { error: "Pick one of the four answers" }),
    applianceId: z.string().uuid("applianceId must be a UUID").nullable().optional(),
  })
  .strict()
  .refine((v) => v.answer !== "other" || !!v.applianceId, {
    message: "Choosing another appliance needs an appliance",
    path: ["applianceId"],
  });

export type ConfirmEventInput = z.infer<typeof confirmEventSchema>;

/** One question in the queue. Timestamps are UTC ISO; the browser localises them. */
export type PendingEvent = {
  id: string;
  applianceId: string;
  applianceName: string;
  startedAt: string;
  endedAt: string | null;
  watts: number | null; // the step this appliance added (delta_on_w), or its peak
  energyKwh: number;
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
